const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');
const fs = require('fs');
const Queue = require('bull');
const dbClient = require('../utils/db');

class FilesController {
  static async postUpload(req, res) {
    const { name, type, data, parentId, isPublic } = req.body;
    const { userId } = req;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId) {
      const filesCollection = await dbClient.client.collection('files');
      const parentFile = await filesCollection.findOne({
        _id: ObjectId(parentId),
      });

      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    let localPath = '';

    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, true);
      }

      localPath = `${folderPath}/${uuidv4()}`;

      const fileBuffer = Buffer.from(data, 'base64');

      fs.writeFileSync(localPath, fileBuffer);
    }

    const filesCollection = await dbClient.client.collection('files');

    const newFile = {
      userId,
      name,
      type,
      isPublic,
      parentId: parentId || 0,
    };

    if (type !== 'folder') {
      newFile.localPath = localPath;
    }
    const result = await filesCollection.insertOne(newFile);

    const { _id: id, ...rest } = result.ops[0];
    const newResult = { id, ...rest };

    const fileQueue = Queue('fileQueue');
    if (type === 'image') {
      fileQueue.add({
        userId,
        fileId: id,
      });
    }

    return res.status(201).json(newResult);
  }
}