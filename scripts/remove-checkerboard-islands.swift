import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count == 3 else {
  fatalError("usage: remove-checkerboard-islands input output")
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
guard
  let source = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
  let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
else { fatalError("unable to read input image") }

let width = image.width
let height = image.height
let bytesPerRow = width * 4
var pixels = [UInt8](repeating: 0, count: height * bytesPerRow)
let colorSpace = CGColorSpaceCreateDeviceRGB()

pixels.withUnsafeMutableBytes { raw in
  guard let context = CGContext(
    data: raw.baseAddress,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: bytesPerRow,
    space: colorSpace,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  ) else { return }
  context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
}

func isCheckerCandidate(_ index: Int) -> Bool {
  let offset = index * 4
  guard pixels[offset + 3] > 0 else { return false }
  let r = Int(pixels[offset])
  let g = Int(pixels[offset + 1])
  let b = Int(pixels[offset + 2])
  let maximum = max(r, g, b)
  let minimum = min(r, g, b)
  let luminance = (2126 * r + 7152 * g + 722 * b) / 10_000
  return maximum - minimum < 34 && luminance > 128
}

var visited = [Bool](repeating: false, count: width * height)
var queue = [Int]()
var component = [Int]()
queue.reserveCapacity(width * height / 3)
component.reserveCapacity(width * height / 3)

for start in 0..<(width * height) {
  if visited[start] || !isCheckerCandidate(start) { continue }
  visited[start] = true
  queue.removeAll(keepingCapacity: true)
  component.removeAll(keepingCapacity: true)
  queue.append(start)
  var cursor = 0
  while cursor < queue.count {
    let index = queue[cursor]
    cursor += 1
    component.append(index)
    let x = index % width
    let y = index / width
    let neighbors = [x > 0 ? index - 1 : -1, x + 1 < width ? index + 1 : -1, y > 0 ? index - width : -1, y + 1 < height ? index + width : -1]
    for neighbor in neighbors where neighbor >= 0 && !visited[neighbor] && isCheckerCandidate(neighbor) {
      visited[neighbor] = true
      queue.append(neighbor)
    }
  }
  if component.count > 4_000 {
    for index in component { pixels[index * 4 + 3] = 0 }
  }
}

let provider = CGDataProvider(data: Data(pixels) as CFData)!
let output = CGImage(
  width: width,
  height: height,
  bitsPerComponent: 8,
  bitsPerPixel: 32,
  bytesPerRow: bytesPerRow,
  space: colorSpace,
  bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
  provider: provider,
  decode: nil,
  shouldInterpolate: true,
  intent: .defaultIntent
)!
let destination = CGImageDestinationCreateWithURL(outputURL as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(destination, output, nil)
guard CGImageDestinationFinalize(destination) else { fatalError("unable to save output image") }
