const users = JSON.parse(fs.readFileSync('users.json'));

users.forEach(user => {
  bot.sendMessage(user.id, "Salom! Bugungi aksiya: 2 ta perashki olsangiz, 1 ta bepul!");
});
