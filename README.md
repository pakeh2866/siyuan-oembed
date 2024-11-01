
# SiYuan Oembed and Ghost-style bookmark cards

[![Last commit](https://img.shields.io/github/last-commit/anarion80/siyuan-oembed)](https://github.com/anarion80/siyuan-oembed/commits/main)
[![Releases](https://img.shields.io/github/v/release/anarion80/siyuan-oembed?include_prereleases&color=success)](https://github.com/anarion80/siyuan-oembed/releases)
![GitHub License](https://img.shields.io/github/license/anarion80/siyuan-oembed)
[![BuyMeACoffee](https://raw.githubusercontent.com/pachadotdev/buymeacoffee-badges/main/bmc-yellow.svg)](https://buymeacoffee.com/anarion)

## Plugin description

This is a plugin that has two main functionalities:

1. It allows to convert links (URLs) to their embedded representation according to [Oembed](https://oembed.com/) format. When supported by a given site, a link can be converted directly to a photo or video, or any other format provided by the site.

2. It allows to convert links (URLs) to a nice bookmark card representation based on [Ghost CMS](https://ghost.org/) [Bookmark cards](https://ghost.org/help/cards/#bookmark). I reused implementation from my [Astro Simply](https://github.com/anarion80/astro-simply) theme.

Both funcionalities are independent of each other, so you can covert to either oembed or bookmark card.

It works like this:

![preview.png](preview.png)

> :exclamation:
> Unfortunately, X.com (formerly Twitter) embeds are script-based, and I haven't figured out yet why the script is not executed despite having script exeuction enabled in settings (see: [my post on Liuyun.io](https://liuyun.io/article/1729866570402)) :exclamation:
>
> Similarly, Facebook/Instagram requires an API_KEY to be able to embed their content

Due to the above, oembed has perhaps limited usability and I might need to add an explicit Twitter conversion for tweets.

## Usage

The plugin provides three ways to convert the links:

1. Slash commands with associated hot-keys:
   - `/oembed`, `/Oembed`, `/oe`, `Ctrl`+`Shift`+`O` for Oembed conversion
   - `/card`, `/bookmark`, `/bk`, `Ctrl`+`Shift`+`C` for bookmark card conversion
  ![Slash Commands](asset/slashcommands.png)

2. Block Icon Menu after selecting one or more blocks:
  ![Block Icon Menu](asset/blockiconmenu.png)

3. Separate toolbar icons:
  ![Toolbar icons](asset/toolbar.png)

> :exclamation:
> Both conversions are supported as a toggle. Triggering action once converts the link to oembed or bookmark card. Triggering it the second time converts back to the ususal link.

## Settings

There are several configuration settings available for the plugin:

- `Catch clipboard links` - Automatically transform links pasted from clipboard to either oembed or bookmark card (:exclamation: Not implemented yet!)
- `Select paste conversion` - Which conversion to automatically apply when pasting a link from clipboard (:exclamation: Not implemented yet!)
- `Enable debug` - Enable verbose debug to help with troubleshooting
- `Blocklist` for oembed - List of domains to skip conversion for (one per line) (:exclamation: Not implemented yet!)
- `Blocklist` for bookmark cards - List of domains to skip conversion for (one per line) (:exclamation: Not implemented yet!)
- `Custom CSS for bookmark cards` - Ability to enter custom CSS to style the bookmark cards. All `kg-card-*` and `kg-bookmark-*` classes can be styled.
