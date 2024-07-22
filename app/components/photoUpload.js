import { useRef, useState } from "react";
import AWS from "aws-sdk";
import { uuidv4 } from "@/utils/strings";

export default function PhotoUpload() {
  const fileInputRef = useRef(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageNames, setImageNames] = useState([]);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    const newImageNames = newFiles.map((file) => file.name);

    const newSelectedImages = newFiles.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newSelectedImages).then((images) => {
      setSelectedImages((prevImages) => [...prevImages, ...images]);
    });

    setImageNames((prevNames) => [...prevNames, ...newImageNames]);
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleRemoveImage = (index) => {
    setSelectedImages((prevImages) => prevImages.filter((_, i) => i !== index));
    setImageNames((prevNames) => prevNames.filter((_, i) => i !== index));
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!files.length) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/get-upload-signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bucketName: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
          prefix: "",
        }),
      });

      const data = await response.json();
      console.log(data);

      if (data.status !== "ok") {
        throw new Error(data.message);
      }

      const s3 = new AWS.S3({
        accessKeyId: data.data.AWSAccessKeyID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
        region: process.env.NEXT_PUBLIC_AWS_REGION,
      });

      const rekognition = new AWS.Rekognition({
        accessKeyId: data.data.AWSAccessKeyID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
        region: process.env.NEXT_PUBLIC_AWS_REGION,
      });

      const uploadPromises = files.map(async (file, index) => {
        const key = `${uuidv4()}.${file.name.split(".").at(-1)}`;
        const ExternalImageId = key;
        console.log(ExternalImageId);
        const params = {
          Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
          Key: key,
          Body: file,
          ContentType: file.type,
        };
        const uploadResult = await s3.upload(params).promise();

        // Index the face using AWS Rekognition
        const indexParams = {
          CollectionId: process.env.NEXT_PUBLIC_REKOGNITION_COLLECTION_ID,
          Image: {
            S3Object: {
              Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
              Name: key,
            },
          },
          ExternalImageId: ExternalImageId,
        };

        const indexResult = await rekognition.indexFaces(indexParams).promise();

        const faceRecords = indexResult.FaceRecords;

        if (faceRecords.length === 0) {
          setErrorMessage(`Không thấy khuôn mặt nào trong bức ảnh bạn tải lên`);
          return;
        }

        if (faceRecords.length > 10) {
          setErrorMessage(`Quá nhiều khuôn mặt trong một bức ảnh`);
          return;
        }

        // Log the FaceId and ImageId to the console
        const faceId = faceRecords[0].Face.FaceId;
        console.log(`Image ID: ${key}, Face ID: ${faceId}`);

        // Store the image ID and key in MongoDB
        const saveImageData = async (imageId, key) => {
          const saveResponse = await fetch("/api/image-entry", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageId,
              key,
            }),
          });

          const saveData = await saveResponse.json();
          if (saveData.status !== "ok") {
            throw new Error(saveData.message);
          }

          console.log(`Saved data for image ID: ${imageId}`);
        };

        await saveImageData(faceId, key);

        return uploadResult;
      });

      await Promise.all(uploadPromises);
      console.log("Files uploaded and indexed successfully");

      // Clear the images after successful upload
      setSelectedImages([]);
      setImageNames([]);
      setFiles([]);
    } catch (error) {
      console.error("Error uploading files: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-3xl font-bold text-gray-700 mb-4">
        Gửi ảnh lên ở đây
      </h2>
      <button
        onClick={() => fileInputRef.current.click()}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-300 mb-4 focus:outline-none"
      >
        Chọn ảnh từ trong máy
      </button>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        multiple
      />
      {selectedImages.length > 0 && (
        <div className="mt-6 flex flex-col items-center">
          <div className="grid grid-cols-3 gap-4">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative flex flex-col items-center">
                <img
                  src={image}
                  alt={imageNames[index]}
                  className="w-32 h-32 object-cover rounded-lg shadow-lg"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  &times;
                </button>
                <p className="mt-2 text-center text-gray-600 text-sm">
                  {imageNames[index]}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-300 mt-4 focus:outline-none"
          >
            Submit
          </button>
        </div>
      )}
      {isLoading && (
        <div className="mt-4">
          <div className="spinner border-t-4 border-blue-500 border-solid rounded-full w-16 h-16 animate-spin"></div>
        </div>
      )}
      {errorMessage && (
        <div className="mt-4 text-red-600 font-bold">{errorMessage}</div>
      )}
    </div>
  );
}
