// [Previous content remains the same until renderLists function]

function renderLists() {
    listsContainer.innerHTML = '';
    
    lists.forEach(list => {
        const listElement = document.createElement('div');
        listElement.className = 'bg-gray-800 p-4 rounded-lg shadow-lg';
        
        listElement.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold">🏪 ${list.store}</h3>
                <div class="flex gap-2">
                    <span class="text-gray-400">📍 ${list.radius}m</span>
                    <button onclick="deleteList(${list.id})" class="text-gray-400 hover:text-red-500 focus:outline-none">🗑️</button>
                </div>
            </div>
            <div class="space-y-2">
                ${list.items.map(item => `
                    <div class="flex items-center justify-between bg-gray-700 p-2 rounded">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox"
                                   ${item.completed ? 'checked' : ''}
                                   onchange="toggleItem(${list.id}, ${item.id})"
                                   class="rounded bg-gray-600 border-gray-500 text-tmobile focus:ring-tmobile">
                            <span class="${item.completed ? 'line-through text-gray-400' : ''}">
                                ${item.completed ? '✅' : '📝'} ${item.name}
                            </span>
                        </label>
                        <button onclick="deleteItem(${list.id}, ${item.id})" class="text-gray-400 hover:text-red-500 focus:outline-none">🗑️</button>
                    </div>
                `).join('')}
            </div>
            <button onclick="addToList(${list.id})" class="mt-4 w-full btn">
                ✨ Add Item
            </button>
        `;
        
        listsContainer.appendChild(listElement);
    });
}

// [Rest of the file remains the same]
