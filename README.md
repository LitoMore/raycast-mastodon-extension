# Raycast Extension for Mastodon

![overview](./media/command.png)

-  [Mastodon](https://joinmastodon.org/) 
-  [Raycast](https://raycast.com)

**Features**:
- Write status with markdown support.(Only if the instant supports Markdown)
- Publish simple status with text.
- Publish scheduled status with natural date format.
- Publish status with attachments (image, video, files); add alt text to the image when only one image is attached.
- Save draft status.
- View your bookmarked statuses.
- View your latest statuses.
- Open the latest published status that was published from Raycast through the actions.

## Settings

Input your Mastodon instance's URL, then click the "Continue" button in the bottom-right corner.

![](./media/settings.png)

## Examples:

### Add simple status with text

![](./metadata/mastodon-10.png)

### Add scheduled status

![](./metadata/mastodon-7.png)

### Add status with image and alt text

![](./metadata/mastodon-4.png)

### View your latest status

![](./metadata/mastodon-11.png)

### Mark status as sensitive 
Toggle the "Sensitive" checkbox to mark the attached image as sensitive, or add a content warning to the status.

![](media/add-cw.png.png)

### Write status with markdown
Toggle the "Markdown" checkbox to render markdown in the text file. Markdown shortcuts are also supported (e.g., pressing `⌘` + `B` will add `**bold**` around the selected text, `⌘` + `I` will make the selected text italic, etc.).

![](media/markdown.png)

### Draft status 

![](media/draft.png)

## Available Settings

### Status limit
Based on performance considerations, the number of statuses displayed is limited, with the default being 20. You can adjust this limit in the extension settings.

![](media/setting-status.png)

### Default visibility

![](media/settings.png)

If the instance supports Markdown, please select the `Built-in Markdown Support` checkbox. 

## Actions 
![](media/actions.png)
