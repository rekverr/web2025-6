import express from 'express';
import { Command } from 'commander';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const program = new Command();

program
  .requiredOption('-h, --host <host>', 'Server host')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <path>', 'Cache directory path')
  .parse(process.argv);

const { port, host, cache } = program.opts();

const app = express();
const upload = multer();

const notes = {};

app.use(express.text());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @swagger
 * components:
 *   schemas:
 *     Note:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Ім'я нотатки
 *         text:
 *           type: string
 *           description: Текст нотатки
 *       required:
 *         - name
 *         - text
 */

/**
 * @swagger
 * /notes/{name}:
 *   get:
 *     summary: Отримати нотатку за імʼям
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Імʼя нотатки
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Текст нотатки
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: Нотатку не знайдено
 */
app.get('/notes/:name', (req, res) => {
  const noteName = req.params.name;
  if (!(noteName in notes)) {
    return res.status(404).send('Note not found');
  }
  res.send(notes[noteName]);
});

/**
 * @swagger
 * /notes/{name}:
 *   put:
 *     summary: Оновити існуючу нотатку
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Імʼя нотатки для оновлення
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *     responses:
 *       200:
 *         description: Нотатку оновлено
 *       404:
 *         description: Нотатку не знайдено
 */
app.put('/notes/:name', (req, res) => {
  const noteName = req.params.name;
  if (!(noteName in notes)) {
    return res.status(404).send('Note not found');
  }
  notes[noteName] = req.body;
  res.send('Note updated');
});

/**
 * @swagger
 * /notes/{name}:
 *   delete:
 *     summary: Видалити нотатку за імʼям
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Імʼя нотатки для видалення
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Нотатку видалено
 *       404:
 *         description: Нотатку не знайдено
 */
app.delete('/notes/:name', (req, res) => {
  const noteName = req.params.name;
  if (!(noteName in notes)) {
    return res.status(404).send('Note not found');
  }
  delete notes[noteName];
  res.send('Note deleted');
});

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Отримати список всіх нотаток
 *     responses:
 *       200:
 *         description: Список нотаток
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 */
app.get('/notes', (req, res) => {
  const notesArray = Object.entries(notes).map(([name, text]) => ({ name, text }));
  res.json(notesArray);
});

/**
 * @swagger
 * /write:
 *   post:
 *     summary: Створити нову нотатку
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               note_name:
 *                 type: string
 *                 description: Імʼя нотатки
 *               note:
 *                 type: string
 *                 description: Текст нотатки
 *             required:
 *               - note_name
 *               - note
 *     responses:
 *       201:
 *         description: Нотатку створено
 *       400:
 *         description: Нотатка з таким імʼям вже існує або відсутні параметри
 */
app.post('/write', upload.none(), (req, res) => {
  const noteName = req.body.note_name;
  const noteText = req.body.note;

  if (!noteName || !noteText) {
    return res.status(400).send('Missing note_name or note');
  }

  if (noteName in notes) {
    return res.status(400).send('Note already exists');
  }

  notes[noteName] = noteText;
  res.status(201).send('Note created');
});

/**
 * @swagger
 * /UploadForm.html:
 *   get:
 *     summary: Повертає HTML форму для завантаження нотатки
 *     responses:
 *       200:
 *         description: HTML сторінка з формою
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
app.get('/UploadForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UploadForm.html'));
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notes Service API',
      version: '1.0.0',
      description: 'API для керування нотатками',
    },
    servers: [
      {
        url: `http://${host}:${port}`,
      },
    ],
  },
  apis: [__filename],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(Number(port), host, () => {
  console.log(`Server started at http://${host}:${port}`);
  console.log(`Cache directory: ${cache}`);
});
