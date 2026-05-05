const { getSignedUrlFromS3 } = require("./aws.util");

const attachImageUrls = async (doc, field = "images") => {
  const obj = doc.toObject ? doc.toObject() : doc;

  if (!obj?.[field] || !Array.isArray(obj[field])) return obj;

  obj[field] = await Promise.all(
    obj[field].map(async (img) => {
      const plainImg = img.toObject ? img.toObject() : img;

      return {
        ...plainImg,
        url: plainImg.key ? await getSignedUrlFromS3(plainImg.key) : null,
      };
    })
  );

  return obj;
};

const attachImageUrlsList = async (docs, field = "images") => {
  if (!Array.isArray(docs)) return [];

  return Promise.all(
    docs.map((d) => attachImageUrls(d, field))
  );
};

module.exports = {
  attachImageUrls,
  attachImageUrlsList,
};