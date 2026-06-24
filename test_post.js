const url = 'https://script.google.com/macros/s/AKfycbwLLywyEdvDZhKajLmbpN8ZeFTeYkB5DRc3umPpdquRMekRnqc9ZSb2YBNguumBfXvb/exec';

const payload = {
  action: 'addRecipe',
  data: { id: 12345, menuName: 'Test Menu', targetMarginPercent: 30, ingredients: [] }
};

fetch(url, {
  method: 'POST',
  body: JSON.stringify(payload)
})
.then(res => res.text())
.then(text => console.log('Response:', text))
.catch(err => console.error('Error:', err));
