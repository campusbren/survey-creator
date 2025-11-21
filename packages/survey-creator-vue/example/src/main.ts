import { createApp } from 'vue'
import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";
import App from './App.vue'
import router from './router'
import PropertyGridWrapper from './components/PropertyGridWrapper.vue'
import { ComponentFactory } from 'survey-vue3-ui'

// Register custom property grid wrapper BEFORE creating the app
ComponentFactory.Instance.registerComponent('svc-property-grid', PropertyGridWrapper);

const app = createApp(App)
app.use(router);

app.mount('#app')
