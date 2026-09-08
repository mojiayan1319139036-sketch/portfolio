import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count == 3 else {
  fatalError("usage: cutout-dark-background input output")
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
guard
  let source = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
  let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
else { fatalError("unable to read input image") }

let width = image.width
let height = image.height
let bytesPerPixel = 4
let bytesPerRow = width * bytesPerPixel
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

func isDarkBackground(_ index: Int) -> Bool {
  let offset = index * 4
  let r = Double(pixels[offset])
  let g = Double(pixels[offset + 1])
  let b = Double(pixels[offset + 2])
  let luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance < 78 && r < 92 && g < 92 && b < 112
}

var visited = [Bool](repeating: false, count: width * height)
var queue = [Int]()
queue.reserveCapacity(width * height / 2)

func enqueue(_ index: Int) {
  guard !visited[index], isDarkBackground(index) else { return }
  visited[index] = true
  queue.append(index)
}

for x in 0..<width {
  enqueue(x)
  enqueue((height - 1) * width + x)
}
for y in 0..<height {
  enqueue(y * width)
  enqueue(y * width + width - 1)
}

var cursor = 0
while cursor < queue.count {
  let index = queue[cursor]
  cursor += 1
  let x = index % width
  let y = index / width
  if x > 0 { enqueue(index - 1) }
  if x + 1 < width { enqueue(index + 1) }
  if y > 0 { enqueue(index - width) }
  if y + 1 < height { enqueue(index + width) }
}

for index in 0..<visited.count where visited[index] {
  pixels[index * 4 + 3] = 0
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
