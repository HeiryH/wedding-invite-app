using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

/// <summary>
/// The Adjust panel's "+ Image" (and background-replace) uploads use the LAYER_IMAGE slot. Couple
/// uploads are rejected unless their slot is in <see cref="TemplateSlots.All"/>, and — unlike every
/// other couple slot — LayerImage must NOT upsert, so a stage can hold many images. These pin both
/// facts the upload path depends on (see PhotoService.UploadAsync).
/// </summary>
public class PhotoSlotTests
{
    [Fact]
    public void LayerImage_IsRegisteredForCoupleUploads()
    {
        Assert.Contains(TemplateSlots.LayerImage, TemplateSlots.All);
    }

    [Fact]
    public void LayerImage_HasAStableValueDistinctFromOtherSlots()
    {
        // The frontend mirrors this constant (lib/api/types.ts); a drift would silently 400 uploads.
        Assert.Equal(20, TemplateSlots.LayerImage);
        Assert.Single(TemplateSlots.All, s => s == TemplateSlots.LayerImage);
    }
}
