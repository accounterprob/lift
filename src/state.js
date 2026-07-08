// Lightweight shared state. View modules import getters/setters from here;
// changes broadcast through the shared event bus in utils.js.

import { emit } from './utils.js';

let _currentTab = 'workout';

export function setCurrentTab(tab) {
  if (_currentTab === tab) return;
  _currentTab = tab;
  emit('tab:changed', tab);
}
