import { createApp } from 'vue'
import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";
import App from './App.vue'
import router from './router'
import FieldPipingSidebar from './components/FieldPipingSidebar.vue'
import { ComponentFactory } from 'survey-vue3-ui'

// Register FieldPipingSidebar as a custom sidebar page component
ComponentFactory.Instance.registerComponent('field-piping-sidebar-page', FieldPipingSidebar);

const app = createApp(App)
app.use(router);

app.mount('#app')
