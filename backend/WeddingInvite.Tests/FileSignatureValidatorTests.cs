using System.Text;
using Microsoft.AspNetCore.Http;
using WeddingInvite.Core.Utilities;
using Xunit;

namespace WeddingInvite.Tests;

/// <summary>
/// Uploads are validated by magic bytes, not the (spoofable) extension. These pin the image
/// signatures the Adjust panel's image/background uploads depend on — webp especially, since that's
/// the format most web images (and Template 7's own art) ship as.
/// </summary>
public class FileSignatureValidatorTests
{
    private static IFormFile File(byte[] bytes, string fileName)
    {
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "File", fileName)
        {
            Headers = new HeaderDictionary(),
        };
    }

    private static byte[] WebP(string fourCcAtEight)
    {
        // "RIFF" + 4-byte size + <fourCC> + a little payload.
        var b = new List<byte>();
        b.AddRange("RIFF"u8.ToArray());
        b.AddRange(new byte[] { 0x20, 0x00, 0x00, 0x00 });
        b.AddRange(Encoding.ASCII.GetBytes(fourCcAtEight));
        b.AddRange(new byte[8]);
        return b.ToArray();
    }

    [Fact]
    public void Accepts_RealWebP()
    {
        Assert.True(FileSignatureValidator.IsValidImage(File(WebP("WEBP"), "photo.webp"), ".webp"));
    }

    [Fact]
    public void Rejects_RiffThatIsNotWebP()
    {
        // A WAV (RIFF…WAVE) renamed to .webp must not slip through.
        Assert.False(FileSignatureValidator.IsValidImage(File(WebP("WAVE"), "fake.webp"), ".webp"));
    }

    [Fact]
    public void Accepts_Png()
    {
        var png = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0 };
        Assert.True(FileSignatureValidator.IsValidImage(File(png, "shot.png"), ".png"));
    }
}
