import { uuidv4 } from "@/utils/strings";
import AWS from "aws-sdk";

const collectionId = process.env.NEXT_PUBLIC_REKOGNITION_COLLECTION_ID;
const bucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;

const s3 = new AWS.S3({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
});
const rekognition = new AWS.Rekognition({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
});

export const createCollection = async (idToCreate) => {
  try {
    const createCollectionRequest = {
      CollectionId: idToCreate,
    };

    const createCollectionResponse = await rekognition
      .createCollection(createCollectionRequest)
      .promise();
    console.log(
      "Creating collection OK:",
      collectionId,
      createCollectionResponse
    );
  } catch (error) {
    console.error("Exception Create Collection:", error.toString());
  }
};

export const listCollections = async () => {
  try {
    const createCollectionResponse = await rekognition
      .listCollections()
      .promise();
    console.log(
      "Creating collection OK:",
      collectionId,
      createCollectionResponse
    );
  } catch (error) {
    console.error("Exception Create Collection:", error.toString());
  }
};

export const deleteCollection = async (idToDel) => {
  try {
    const createCollectionRequest = {
      CollectionId: idToDel,
    };

    const createCollectionResponse = await rekognition
      .deleteCollection(createCollectionRequest)
      .promise();
    console.log(
      "Creating collection OK:",
      collectionId,
      createCollectionResponse
    );
  } catch (error) {
    console.error("Exception Create Collection:", error.toString());
  }
};

export const indexFaces = async (file) => {
  const key = `${uuidv4()}-rekognition.${file.name.split(".").at(-1)}`;
  const ExternalImageId = key;
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: file.type,
  };

  try {
    const uploadResult = await s3.upload(params).promise();
    console.log("Upload successful:", uploadResult);

    const indexParams = {
      CollectionId: collectionId,
      Image: {
        S3Object: {
          Bucket: bucketName,
          Name: key,
        },
      },
      ExternalImageId: ExternalImageId,
    };

    const indexResult = await rekognition.indexFaces(indexParams).promise();
    console.log("Indexing successful:", indexResult);

    if (indexResult.FaceRecords.length === 0) {
      throw new Error("Không thấy khuôn mặt nào trong bức ảnh bạn tải lên ");
    }
    if (indexResult.FaceRecords.length > 100) {
      throw new Error("Có quá nhiều khuôn mặt trong ảnh bạn tải lên");
    }

    if (key.includes("-rekognition")) {
      const deleteParams = {
        Bucket: bucketName,
        Key: key,
      };
      await s3.deleteObject(deleteParams).promise();
      console.log(`Deleted image: ${key}`);
    }

    return { key, indexResult };
  } catch (error) {
    console.error("Error indexing faces:", error);
    throw error;
  }
};

export const listFaces = async () => {
  const indexParams = {
    CollectionId: collectionId,
  };

  return await rekognition.listFaces(indexParams).promise();
};

export const deleteFaces = async (facesArray) => {
  let faceIds = facesArray;

  if (!faceIds) {
    const { Faces: allFaces } = await listFaces();
    faceIds = allFaces.map(({ FaceId }) => FaceId);
  }

  if (!Array.isArray(faceIds) || !faceIds.length) return;

  console.log(faceIds);

  const indexParams = {
    CollectionId: collectionId,
    FaceIds: faceIds,
  };

  const indexResult = await rekognition.deleteFaces(indexParams).promise();

  return { indexResult };
};
