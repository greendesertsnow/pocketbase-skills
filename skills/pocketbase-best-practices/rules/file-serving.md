---
title: Generate File URLs Correctly
impact: MEDIUM
impactDescription: Proper URLs with thumbnails and access control
tags: files, urls, thumbnails, serving
---

## Generate File URLs Correctly

Use the SDK's `getURL` method to generate proper file URLs with thumbnail support and access tokens for protected files.

**Incorrect (manually constructing URLs):**

```javascript
// Hardcoded URL construction - brittle
const imageUrl = `http://localhost:8090/api/files/${record.collectionId}/${record.id}/${record.image}`;

// Missing token for protected files
const privateUrl = pb.files.getURL(record, record.document);
// Returns URL but file access denied if protected!

// Wrong thumbnail syntax
const thumb = `${imageUrl}?thumb=100x100`;  // Wrong format
```

**Correct (using SDK methods):**

```javascript
// Basic file URL
const imageUrl = pb.files.getURL(record, record.image);
// Returns: http://host/api/files/COLLECTION/RECORD_ID/filename.jpg

// With thumbnail (for images only)
const thumbUrl = pb.files.getURL(record, record.image, {
  thumb: '100x100'  // Width x Height
});

// Thumbnail options
const thumbs = {
  square: pb.files.getURL(record, record.image, { thumb: '100x100' }),
  fit: pb.files.getURL(record, record.image, { thumb: '100x0' }),     // Fit width
  fitHeight: pb.files.getURL(record, record.image, { thumb: '0x100' }), // Fit height
  crop: pb.files.getURL(record, record.image, { thumb: '100x100t' }), // Top crop
  cropBottom: pb.files.getURL(record, record.image, { thumb: '100x100b' }), // Bottom
  force: pb.files.getURL(record, record.image, { thumb: '100x100f' }), // Force exact
};

// Protected files (require auth)
async function getProtectedFileUrl(record, filename) {
  // Get file access token (valid for limited time)
  const token = await pb.files.getToken();

  // Include token in URL
  return pb.files.getURL(record, filename, { token });
}

// Example with protected document
async function downloadDocument(record) {
  const token = await pb.files.getToken();
  const url = pb.files.getURL(record, record.document, { token });

  // Token is appended: ...?token=xxx
  window.open(url, '_blank');
}
```

**React component example:**

```jsx
function UserAvatar({ user, size = 50 }) {
  if (!user.avatar) {
    return <DefaultAvatar size={size} />;
  }

  const avatarUrl = pb.files.getURL(user, user.avatar, {
    thumb: `${size}x${size}`
  });

  return (
    <img
      src={avatarUrl}
      alt={user.name}
      width={size}
      height={size}
      loading="lazy"
    />
  );
}

function ImageGallery({ record }) {
  // Record has multiple images
  const images = record.images || [];

  return (
    <div className="gallery">
      {images.map((filename, index) => (
        <img
          key={filename}
          src={pb.files.getURL(record, filename, { thumb: '200x200' })}
          onClick={() => openFullSize(record, filename)}
          loading="lazy"
        />
      ))}
    </div>
  );
}

function openFullSize(record, filename) {
  const fullUrl = pb.files.getURL(record, filename);
  window.open(fullUrl, '_blank');
}
```

**Handling file URLs in lists:**

```javascript
// Efficiently generate URLs for list of records
const posts = await pb.collection('posts').getList(1, 20, {
  expand: 'author'
});

const postsWithUrls = posts.items.map(post => ({
  ...post,
  thumbnailUrl: post.image
    ? pb.files.getURL(post, post.image, { thumb: '300x200' })
    : null,
  authorAvatarUrl: post.expand?.author?.avatar
    ? pb.files.getURL(post.expand.author, post.expand.author.avatar, { thumb: '40x40' })
    : null
}));
```

**Thumbnail format reference:**

| Format | Description |
|--------|-------------|
| `WxH` | Fit within dimensions |
| `Wx0` | Fit width, auto height |
| `0xH` | Auto width, fit height |
| `WxHt` | Crop from top |
| `WxHb` | Crop from bottom |
| `WxHf` | Force exact dimensions |

Reference: [PocketBase Files](https://pocketbase.io/docs/files-handling/)
