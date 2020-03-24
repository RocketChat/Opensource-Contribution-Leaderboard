const textarea = document.querySelector('#exampleFormControlTextarea6');
const previewContainer = document.querySelector('#markdown-preview');
const cardsContainer = document.querySelector('.dashboard.cards');
const deleteButtons = document.querySelectorAll('.delete.is-small');
const converter = new showdown.Converter();
let title = '';
let category = '';
let text = '';

autosize(textarea);
renderCardsHeight();

function renderCardsHeight() {
	const cards = document.querySelectorAll('.card');
	let totalHeight = 0;
	cards.forEach(card => {
		totalHeight += card.clientHeight;
		totalHeight += 20;
	})
	cardsContainer.style.height = totalHeight/4 + 'px';
}

textarea.addEventListener('input', () => {
	if (!textarea.value) {
		previewContainer.classList.add('none');
	} else {
		previewContainer.classList.remove('none');
	}
	let reg = /^([^\ ]+)\ ([^\n]+)/;
	const match = textarea.value.match(reg);
	let parsed = '';
	if (!match) {
		parsed = converter.makeHtml('##### ' + textarea.value);
	}
	if (match && match[1]) {
		title = match[1];
	}
	if (match && match[2]) {
		category = match[2].substr(0, 1).toUpperCase() + match[2].substr(1);
		text = converter.makeHtml(textarea.value.replace(reg, ''));
	} else {
		const titleMatch = textarea.value.match(/^([^\ \n]+)/);
		if (titleMatch && titleMatch[1]) {
			title = titleMatch[1];
		}
		category = '未分类';
		text = converter.makeHtml(textarea.value.replace(/^([^\ \n]+)/, ''));
	}
	const metaGroups = `
	<div class="meta-groups">
		<span class="date post-date">${moment(Date.now()).format('YYYY-MM-DD HH:mm')}</span>
		<span class="tag">${category}</span>
	</div>
	`.trim();
	parsed = converter.makeHtml(`##### ${title}\n${metaGroups}\n${ converter.makeHtml(text)}`.trim())
	previewContainer.innerHTML = parsed;
	Prism.highlightAll();
})

textarea.addEventListener('focus', () => {
	textarea.dispatchEvent(new Event('input'));
})

textarea.addEventListener('keydown', function(event) {
	if (event.key === 'Tab') {
		event.preventDefault();
		var selectionStartPos = this.selectionStart;
		var selectionEndPos   = this.selectionEnd;
		var oldContent        = this.value;
		this.value = oldContent.substring( 0, selectionStartPos ) + "\t" + oldContent.substring( selectionEndPos );
		this.selectionStart = this.selectionEnd = selectionStartPos + 1;
	}
	if (event.ctrlKey && event.key === 'Enter') {
		const name = document.querySelector('span#username').innerText;
		if (!title || !category) {
			alert('标题或分类为空！');
			return;
		}
		axios.post('/users/post', {
			author: name,
			title,
			category: category.toUpperCase(),
			content: converter.makeHtml(text)
		})
		.then( ({ data }) => {
			if(!data.success) {
				alert(data.msg);
			} else {
				window.location.pathname = '/dashboard';
			}
		})
		.catch(err => alert(err));
	}
})

deleteButtons.forEach(deleteButton => {
	deleteButton.addEventListener('click', async event => {
		const target = event.target;
		const id = target.parentElement.id;
		try {
			const { data } = await axios.post('/users/delete', { id });
			if (!data.success) {
				alert(data.msg);
			} else {
				window.location.pathname = '/dashboard';
			}
		} catch (err) {
			console.warn(err);
		}
	})
})