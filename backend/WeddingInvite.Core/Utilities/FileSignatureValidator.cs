using Microsoft.AspNetCore.Http;

namespace WeddingInvite.Core.Utilities
{
    /// <summary>
    /// Validates that an uploaded file's real content matches its claimed type by
    /// inspecting the leading "magic bytes", rather than trusting the client-supplied
    /// file extension or Content-Type header (both of which are trivially spoofable).
    /// </summary>
    public static class FileSignatureValidator
    {
        // Each entry: the file offset at which the signature must appear, and the bytes.
        private static readonly Dictionary<string, (int Offset, byte[] Magic)[]> ImageSignatures = new()
        {
            [".jpg"]  = new[] { (0, new byte[] { 0xFF, 0xD8, 0xFF }) },
            [".jpeg"] = new[] { (0, new byte[] { 0xFF, 0xD8, 0xFF }) },
            [".png"]  = new[] { (0, new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }) },
            [".gif"]  = new[] { (0, "GIF87a"u8.ToArray()), (0, "GIF89a"u8.ToArray()) },
        };

        private static readonly Dictionary<string, (int Offset, byte[] Magic)[]> AudioSignatures = new()
        {
            // MP3: either an ID3 tag or a raw MPEG frame sync (0xFFEx/0xFFFx).
            [".mp3"]  = new[] { (0, "ID3"u8.ToArray()), (0, new byte[] { 0xFF, 0xFB }), (0, new byte[] { 0xFF, 0xF3 }), (0, new byte[] { 0xFF, 0xF2 }) },
            [".wav"]  = new[] { (0, "RIFF"u8.ToArray()) },
            [".ogg"]  = new[] { (0, "OggS"u8.ToArray()) },
            [".flac"] = new[] { (0, "fLaC"u8.ToArray()) },
            // MP4 container (m4a/aac): "ftyp" box at offset 4.
            [".m4a"]  = new[] { (4, "ftyp"u8.ToArray()) },
            [".aac"]  = new[] { (4, "ftyp"u8.ToArray()), (0, new byte[] { 0xFF, 0xF1 }), (0, new byte[] { 0xFF, 0xF9 }) },
        };

        /// <summary>Returns true if the file's magic bytes match a known image signature for its extension.</summary>
        public static bool IsValidImage(IFormFile file, string extension) => Matches(file, extension, ImageSignatures);

        /// <summary>Returns true if the file's magic bytes match a known audio signature for its extension.</summary>
        public static bool IsValidAudio(IFormFile file, string extension) => Matches(file, extension, AudioSignatures);

        private static bool Matches(IFormFile file, string extension, Dictionary<string, (int Offset, byte[] Magic)[]> table)
        {
            if (!table.TryGetValue(extension.ToLowerInvariant(), out var signatures))
                return false;

            // Read enough bytes to cover the longest signature + offset.
            var maxNeeded = signatures.Max(s => s.Offset + s.Magic.Length);
            var header = new byte[maxNeeded];

            using var stream = file.OpenReadStream();
            var read = stream.Read(header, 0, maxNeeded);

            foreach (var (offset, magic) in signatures)
            {
                if (read < offset + magic.Length) continue;
                if (header.AsSpan(offset, magic.Length).SequenceEqual(magic)) return true;
            }
            return false;
        }
    }
}
