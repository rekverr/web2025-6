import express from 'express';
import { Command } from 'commander';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

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

app.get('/notes/:name', (req, res) => {
  const noteName = req.params.name;
  if (!(noteName in notes)) {
    return res.status(404).send('Note not found');
  }
  res.send(notes[noteName]);
});

app.put('/notes/:name', (req, res) => {
  const noteName = req.params.name;
  if (!(noteName in notes)) {
    return res.status(404).send('Note not found');
  }
  notes[noteName] = req.body;
  res.send('Note updated');
});

app.delete('/notes/:name', (req, res) => {
  const noteName = req.params.name;
  if (!(noteName in notes)) {
    return res.status(404).send('Note not found');
  }
  delete notes[noteName];
  res.send('Note deleted');
});

app.get('/notes', (req, res) => {
  const notesArray = Object.entries(notes).map(([name, text]) => ({ name, text }));
  res.json(notesArray);
});

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/UploadForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UploadForm.html'));
});

app.listen(Number(port), host, () => {
  console.log(`Server started at http://${host}:${port}`);
  console.log(`Cache directory: ${cache}`);
});
