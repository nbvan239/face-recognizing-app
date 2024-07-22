import { useRef, useState, useEffect } from "react";
import { indexFaces } from "@/utils/rekognition";
import AWS from "aws-sdk";

export default function PhotoSearch() {
  const fileInputRef = useRef(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageNames, setImageNames] = useState([]);
  const [files, setFiles] = useState([]);
  const [rekognitionResults, setRekognitionResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const collectionId = process.env.NEXT_PUBLIC_REKOGNITION_COLLECTION_ID;
  const bucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
  const region = process.env.NEXT_PUBLIC_AWS_REGION;

  const rekognition = new AWS.Rekognition({
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    region: region,
  });

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
    setErrorMessage("");
    setRekognitionResults([]);

    try {
      const indexPromises = files.map((file) => indexFaces(file));
      const results = await Promise.all(indexPromises);

      for (const result of results) {
        if (result.error) {
          setErrorMessage((prevMessage) => `${prevMessage}\n${result.error}`);
          continue;
        }

        const { key, indexResult } = result;
        const faceId = indexResult.FaceRecords[0].Face.FaceId;

        const searchParams = {
          CollectionId: collectionId,
          FaceId: faceId,
          FaceMatchThreshold: 70,
        };

        const searchResult = await rekognition
          .searchFaces(searchParams)
          .promise();

        if (searchResult.FaceMatches.length > 0) {
          setRekognitionResults((prevResults) => [
            ...prevResults,
            {
              key,
              matches: searchResult.FaceMatches,
            },
          ]);
        } else {
          setErrorMessage(
            (prevMessage) =>
              `${prevMessage}\nNo matches found for image: ${key}`
          );
        }
      }

      // Clear the images after successful upload
      clearData();
    } catch (error) {
      console.error("Error processing images with Rekognition:", error);
      setErrorMessage(`${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = () => {
    setSelectedImages([]);
    setImageNames([]);
    setFiles([]);
    setErrorMessage("");
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-3xl font-bold text-gray-700 mb-4">Tìm kiếm ảnh</h2>
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
          <div className="border-t-4 border-blue-500 border-solid rounded-full w-16 h-16 animate-spin"></div>
        </div>
      )}
      {errorMessage && (
        <div className="mt-4 text-red-600 font-bold whitespace-pre-line">
          {errorMessage}
        </div>
      )}
      {rekognitionResults.length > 0 && (
        <div className="mt-4 text-center">
          <h3 className="text-2xl font-bold">Kết quả phân tích:</h3>
          {rekognitionResults.map((result, index) => (
            <div key={index} className="text-left mb-4">
              {result.matches.length > 0 ? (
                result.matches.map((match, matchIndex) => (
                  <div key={matchIndex} className="flex items-center mb-2">
                    <div>
                      <img
                        src={`https://${bucketName}.s3.${region}.amazonaws.com/${match.Face.ExternalImageId}`}
                        alt={`Matched image ${matchIndex}`}
                        className="w-16 h-16 object-cover rounded-lg shadow-lg mr-4"
                      />
                    </div>
                    <div>
                      <p>Similarity: {match.Similarity}%</p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No matches found</p>
              )}
            </div>
          ))}
        </div>
      )}
      {selectedImages.length > 0 && (
        <button
          onClick={clearData}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-300 mt-4 focus:outline-none"
        >
          Clear Data
        </button>
      )}
    </div>
  );
}
