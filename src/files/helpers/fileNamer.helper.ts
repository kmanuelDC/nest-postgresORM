
import { v4 as uuid} from 'uuid';

export const fileNamer = (req: Express.Request, file: Express.Multer.File, callback: Function) => {

    if (!file) return callback(new Error('No file was uploaded.'), false);

    const fileExptension = file.mimetype.split('/')[1];

    const fileName = `${uuid()}.${fileExptension}`;

    callback(null, fileName);
}