const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const dbURI = process.env.mongo; 

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });


const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending',
  },
  dueDate: {
    type: Date,
  },
}, { timestamps: true });


const Task = mongoose.model('Task', taskSchema);


app.post('/api/tasks', async (req, res) => {
  const { title, description, status, dueDate } = req.body;

  if (!title || !description) {
    return res.status(400).send('Title and description are required.');
  }

  try {
    const task = new Task({ title, description, status, dueDate });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


app.get('/api/tasks', async (req, res) => {
  const { status, dueDate } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (dueDate) {
    query.dueDate = { $lte: new Date(dueDate) };
  }

  try {
    const tasks = await Task.find(query);
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, status, dueDate } = req.body;

  try {
    const task = await Task.findByIdAndUpdate(id, { title, description, status, dueDate }, { new: true });
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
