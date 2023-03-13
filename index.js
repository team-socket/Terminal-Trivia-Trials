'use strict';

const inquirer = require('inquirer');
const { socket } = require('../socket');
const axios = require('axios');

async function questions() {
  const otdb = await axios('https://opentdb.com/api.php?amount=10');
  console.log(otdb.data.results);

  let i = 0;

  const questions = otdb.data.results.map(question => {
    i++;
    return {
      type: 'list',
      name: `${i}`,
      message: question.question,
      choices: [
        ...question.incorrect_answers, question.correct_answer,
      ],
    };
  });

  socket.emit('START_TRIVIA', questions);
}

questions();

socket.on('START_TRIVIA', (questions) => {
  inquirer.prompt(questions).then(answers => {
    console.log(answers);
  });
});


