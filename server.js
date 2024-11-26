const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
require("dotenv").config();

const app = express();
const PORT = 3002;

const API_URL = "https://api.todoist.com/rest/v2";
const API_TOKEN = process.env.TODOIST_TOKEN; // Armazene o token em uma variável de ambiente

// Middleware para processar JSON
app.use(express.json());

async function removeLabel(task) {
    try {
      const updatedLabels = task.labels.filter(label => label !== "em_andamento");
  
      await axios.post(`${API_URL}/tasks/${task.id}`, 
        { labels: updatedLabels }, 
        {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json"
          },
        }
      );
  
      console.log(`Label 'em_andamento' removida da tarefa ${task.id}`);
    } catch (error) {
      console.error(`Erro ao remover a label da tarefa ${task.id}:`, error.message);
    }
  }

async function completeTask(taskId) {
    try {
      await axios.post(`${API_URL}/tasks/${taskId}/close`, null, {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      });
      console.log(`Tarefa ${taskId} marcada como concluída.`);
    } catch (error) {
      console.error(`Erro ao concluir a tarefa ${taskId}:`, error.message);
    }
  }

// Endpoint para buscar tarefas pendentes
app.get("/tasks", async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/tasks`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });
    res.json(response.data);

  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar tarefas." });
  }
});

// Endpoint para buscar tarefas com a label 'em_andamento'
app.get("/tasks/em_andamento", async (req, res) => {
    try {
      const response = await axios.get(`${API_URL}/tasks`, {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      });
  
      // Filtrar tarefas com a label 'em_andamento'
      const tasks = response.data;
      const filteredTasks = tasks.filter((task) =>
        task.labels.includes("em_andamento")
      );
  
      res.json(filteredTasks);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar tarefas." });
    }
  });

  cron.schedule("59 23 * * *", async () => {
    console.log("Executando tarefa agendada para concluir tarefas com label 'em_andamento'...");
  
    try {
      const response = await axios.get(`${API_URL}/tasks`, {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      });
  
      // Filtrar tarefas com a label 'em_andamento'
      const tasks = response.data;
      const filteredTasks = tasks.filter((task) =>
        task.labels.includes("em_andamento")
      );
  
      // Concluir cada tarefa encontrada
      for (const task of filteredTasks) {
        await removeLabel(task);
        await completeTask(task.id);
      }
    } catch (error) {
      console.error("Erro ao buscar ou concluir tarefas:", error.message);
    }
  });
  

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
