import AVFoundation
import Foundation

guard CommandLine.arguments.count == 3 else {
  fputs("usage: optimize-video <input> <output>\n", stderr)
  exit(2)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let asset = AVURLAsset(url: inputURL)
let preset = AVAssetExportPresetMediumQuality

Task {
  do {
    let compatible = await AVAssetExportSession.compatibility(ofExportPreset: preset, with: asset, outputFileType: .mp4)
    guard compatible, let session = AVAssetExportSession(asset: asset, presetName: preset) else {
      throw NSError(domain: "VideoExport", code: 1, userInfo: [NSLocalizedDescriptionKey: "The source video cannot be exported with the web preset."])
    }
    try? FileManager.default.removeItem(at: outputURL)
    try await session.export(to: outputURL, as: .mp4)
    exit(0)
  } catch {
    fputs("\(error.localizedDescription)\n", stderr)
    exit(1)
  }
}

dispatchMain()
