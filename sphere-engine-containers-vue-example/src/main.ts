import { createApp } from 'vue'
import App from './App.vue';
import Workspace from './components/Workspace.vue';

const app = createApp(App);

app.component('workspace', Workspace);

createApp(App).mount('#app')
