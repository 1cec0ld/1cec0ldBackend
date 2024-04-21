import { S3Client, ListObjectsCommand } from '@aws-sdk/client-s3';
const s3Client = new S3Client({
  credentials: {
    accessKeyId: 'AKIA3FP322LCBWHTKCXI', 
    secretAccessKey: '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'
  }, 
  region: 'us-west-1',
  //endpoint: 'https://s3.us-west-1.amazonaws.com'
});

const bucketName = '1cec0ld-free-for-all'; // Replace with your bucket name

const Downloads = {
  // Route to get all files in the bucket
  all: async (req, res) => {
    res.set('Content-Type','application/json');
    const command = new ListObjectsCommand({
      Bucket: bucketName,
    });
    try {
      const listResponse = await s3Client.send(command);
      const s3Files = listResponse.Contents.map(item => ({
        Key: item.Key,
        Path: extractPath(item.Key),
        Url: getObjectUrl(item.Key),
      }))
      .filter(item => !item.Key.endsWith('/'));
      
      res.json(s3Files);
    } catch (error) {
      console.error("Error listing S3 files:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}


async function listS3Objects() {
  const command = new ListObjectsCommand({
    Bucket: bucketName,
  });

  const response = await s3Client.send(command);
  const objects = response.Contents;

  // Create a root container to hold the hierarchical structure
  const rootContainer = [];

  // Function to add objects to the container
  const addObjectToContainer = (container, object) => {
    const parts = object.Key.split('/'); // Split the object key into parts

    let currentContainer = container;
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1; // Check if it's a file (last part)

      // Skip empty folder names
      if (!part) {
        return;
      }

      // Check if the part already exists in the current container
      const existingItem = currentContainer.find(item => item.Key === part);

      if (!existingItem) {
        // If it doesn't exist, add it to the container
        const newItem = { Key: part };
        if (isFile) {
          newItem.Url = getObjectUrl(object.Key);
        } else {
          newItem.Contents = [];
        }
        currentContainer.push(newItem);
      }

      // Update the current container for the next iteration
      currentContainer = currentContainer.find(item => item.Key === part).Contents;
    });
  };

  // Iterate over objects and add them to the container
  objects.forEach(object => {
    addObjectToContainer(rootContainer, object);
  });

  return rootContainer;
}


// Function to extract path from S3 object key
function extractPath(key) {
  const segments = key.split("/");
  if (segments.length === 1) {
    return ""; // No path, it's in the root of the bucket
  } else {
    return segments.slice(0, -1).join("/");
  }
}
function getObjectUrl(key) {
  // Generate a URL for the file
  return `https://s3.amazonaws.com/${bucketName}/${key}`;
}

export default Downloads