document.addEventListener('DOMContentLoaded', () => {
    // Application State
    let notes = JSON.parse(localStorage.getItem('aeronotes_data')) || [];
    let currentNoteId = null;
    let saveTimeout = null;

    // DOM Elements Mapping
    const elements = {
        notesList: document.getElementById('notes-list'),
        newNoteBtn: document.getElementById('new-note-btn'),
        searchInput: document.getElementById('search-input'),
        editorPlaceholder: document.getElementById('editor-placeholder'),
        editorActive: document.getElementById('editor-active'),
        noteTitle: document.getElementById('note-title'),
        noteBody: document.getElementById('note-body'),
        saveStatus: document.getElementById('save-status'),
        deleteBtn: document.getElementById('delete-note-btn')
    };

    // Initialization
    renderNotes();

    // Event Listeners binders
    elements.newNoteBtn.addEventListener('click', createNote);
    elements.noteTitle.addEventListener('input', handleEditorInput);
    elements.noteBody.addEventListener('input', handleEditorInput);
    elements.deleteBtn.addEventListener('click', deleteCurrentNote);
    elements.searchInput.addEventListener('input', () => renderNotes(elements.searchInput.value));

    // Internal Utility: Generate unique ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Action: Create new note
    function createNote() {
        const newNote = {
            id: generateId(),
            title: '',
            body: '',
            updatedAt: new Date().toISOString()
        };
        
        // Add note to chronological top
        notes.unshift(newNote);
        saveNotes();
        selectNote(newNote.id);
        renderNotes(elements.searchInput.value);
        
        // Apply focus to title for seamless UX
        setTimeout(() => elements.noteTitle.focus(), 100);
    }

    // Render: update Note List UI
    function renderNotes(searchQuery = '') {
        elements.notesList.innerHTML = '';
        
        const filteredNotes = notes.filter(note => 
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.body.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (filteredNotes.length === 0) {
            elements.notesList.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 0.95rem; line-height: 1.5;">
                    <i class="fa-solid fa-note-sticky" style="font-size: 2rem; margin-bottom: 15px; opacity: 0.5;"></i><br>
                    ${searchQuery ? 'No notes matched your search.' : 'You have no notes.<br>Click the + icon to capture your first thought.'}
                </div>
            `;
            return;
        }

        filteredNotes.forEach(note => {
            const noteEl = document.createElement('div');
            noteEl.className = `note-card ${note.id === currentNoteId ? 'active' : ''}`;
            
            const date = new Date(note.updatedAt);
            const formattedDate = new Intl.DateTimeFormat('en-US', { 
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }).format(date);

            const previewText = note.body ? note.body.substring(0, 100) : 'No additional text...';
            
            noteEl.innerHTML = `
                <div class="note-card-title">${note.title || 'Untitled Note'}</div>
                <div class="note-card-preview">${previewText}</div>
                <span class="note-card-date">${formattedDate}</span>
            `;
            
            noteEl.addEventListener('click', () => selectNote(note.id));
            elements.notesList.appendChild(noteEl);
        });
    }

    // Action: Select Note item
    function selectNote(id) {
        currentNoteId = id;
        const note = notes.find(n => n.id === id);
        
        if (!note) return;
        
        // Update styling of the view
        elements.editorPlaceholder.classList.add('hidden');
        elements.editorActive.classList.remove('hidden');
        
        // Populate inputs
        elements.noteTitle.value = note.title;
        elements.noteBody.value = note.body;
        
        elements.saveStatus.textContent = 'Saved';
        
        // Refresh sidebar view active state changes
        renderNotes(elements.searchInput.value); 
    }

    // Interactor: user inputs to auto-save logic
    function handleEditorInput() {
        if (!currentNoteId) return;
        
        elements.saveStatus.textContent = 'Saving...';
        
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(updateCurrentNote, 600);
    }

    // Action: update currently active note content
    function updateCurrentNote() {
        if (!currentNoteId) return;
        
        const noteIndex = notes.findIndex(n => n.id === currentNoteId);
        if (noteIndex !== -1) {
            notes[noteIndex].title = elements.noteTitle.value;
            notes[noteIndex].body = elements.noteBody.value;
            notes[noteIndex].updatedAt = new Date().toISOString();
            
            // Move updated active note to chronological top
            const [note] = notes.splice(noteIndex, 1);
            notes.unshift(note);
            
            saveNotes();
            renderNotes(elements.searchInput.value);
            
            elements.saveStatus.textContent = 'Saved';
        }
    }

    // Action: user delete active note
    function deleteCurrentNote() {
        if (!currentNoteId) return;
        
        if (confirm('Are you sure you want to delete this note?')) {
            notes = notes.filter(n => n.id !== currentNoteId);
            saveNotes();
            
            currentNoteId = null;
            elements.editorActive.classList.add('hidden');
            elements.editorPlaceholder.classList.remove('hidden');
            
            renderNotes(elements.searchInput.value);
        }
    }

    // Data layer: persist state to window
    function saveNotes() {
        localStorage.setItem('aeronotes_data', JSON.stringify(notes));
    }
});
