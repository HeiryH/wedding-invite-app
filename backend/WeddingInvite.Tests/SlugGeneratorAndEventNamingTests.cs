using WeddingInvite.Core.Utilities;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

/// <summary>
/// Covers the SlugGenerator/EventNaming helpers, now wired into EventService and
/// AuthController.SelfRegister, replacing the two drifted slug generators that used to exist
/// (EventService.GenerateCoupleName / AuthController.GenerateSelfSlug) and the per-call-site
/// "bride &amp; groom" string-building.
/// </summary>
public class SlugGeneratorAndEventNamingTests
{
    [Fact]
    public void GenerateBaseSlug_Wedding_JoinsFirstNamesOfBothNames()
    {
        var slug = SlugGenerator.GenerateBaseSlug(EventTypes.Wedding, "Nur Hidayah", "Firdaus Bin Zainal", null);
        Assert.Equal("nur-firdaus", slug);
    }

    [Fact]
    public void GenerateBaseSlug_Wedding_FallsBackWhenNamesMissing()
    {
        var slug = SlugGenerator.GenerateBaseSlug(EventTypes.Wedding, "", null, null);
        Assert.Equal("bride-groom", slug);
    }

    [Fact]
    public void GenerateBaseSlug_Party_UsesFirstNameOnly()
    {
        var slug = SlugGenerator.GenerateBaseSlug(EventTypes.Party, "Aisyah Batrisyia", null, null);
        Assert.Equal("aisyah", slug);
    }

    [Fact]
    public void GenerateBaseSlug_Ceremony_SlugifiesTitle()
    {
        var slug = SlugGenerator.GenerateBaseSlug(EventTypes.Ceremony, null, null, "Ali's Aqiqah Celebration");
        Assert.Equal("alis-aqiqah-celebration", slug);
    }

    [Fact]
    public void GenerateBaseSlug_Ceremony_FallsBackWhenTitleMissing()
    {
        var slug = SlugGenerator.GenerateBaseSlug(EventTypes.Ceremony, null, null, "   ");
        Assert.Equal("ceremony", slug);
    }

    [Fact]
    public void GetDisplayName_Wedding_JoinsBothNamesWithAmpersand()
    {
        var name = EventNaming.GetDisplayName(EventTypes.Wedding, "Siti", "Ali", null);
        Assert.Equal("Siti & Ali", name);
    }

    [Fact]
    public void GetDisplayName_Party_ReturnsSingleName()
    {
        var name = EventNaming.GetDisplayName(EventTypes.Party, "Aisyah", null, null);
        Assert.Equal("Aisyah", name);
    }

    [Fact]
    public void GetDisplayName_Ceremony_ReturnsTitleVerbatim()
    {
        var name = EventNaming.GetDisplayName(EventTypes.Ceremony, null, null, "Ali's Aqiqah");
        Assert.Equal("Ali's Aqiqah", name);
    }

    [Fact]
    public void GetDisplayName_FallsBackToGenericLabel_WhenNothingProvided()
    {
        var name = EventNaming.GetDisplayName(EventTypes.Wedding, null, null, null);
        Assert.Equal("Event Invitation", name);
    }

    [Theory]
    [InlineData(EventTypes.Wedding, "Siti", "Ali", null, true)]
    [InlineData(EventTypes.Wedding, "Siti", null, null, false)]
    [InlineData(EventTypes.Party, "Aisyah", null, null, true)]
    [InlineData(EventTypes.Party, null, null, null, false)]
    [InlineData(EventTypes.Ceremony, null, null, "Ali's Aqiqah", true)]
    [InlineData(EventTypes.Ceremony, null, null, "  ", false)]
    public void HasRequiredNaming_MatchesEventTypeRequirement(string eventType, string? name1, string? name2, string? title, bool expected)
    {
        Assert.Equal(expected, EventNaming.HasRequiredNaming(eventType, name1, name2, title));
    }
}
