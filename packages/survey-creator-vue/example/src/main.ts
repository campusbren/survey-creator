import { createApp } from 'vue'
import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";
import App from './App.vue'
import router from './router'
// PropertyGridWrapper no longer needed - Show Fields button is now in the top toolbar

const app = createApp(App)
app.use(router);

app.mount('#app')
