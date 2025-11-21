<template>
  <div class="app-container">
    <nav class="app-nav">
      <div class="nav-brand">
        <h1>🎯 SurveyJS Tools</h1>
      </div>
      <div class="nav-links">
        <router-link to="/" class="nav-link">
          📝 Survey Creator
        </router-link>
        <router-link to="/csv-survey" class="nav-link">
          📊 CSV Survey
        </router-link>
      </div>
    </nav>
    <div class="main-content">
      <RouterView></RouterView>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { RouterView } from 'vue-router'
import * as Survey from "survey-core";
import * as SurveyCreatorCore from "survey-creator-core";
import $ from 'jquery';
(window as any).jQuery = (window as any).$ = $;
(window as any).Survey = Object.assign({}, Survey);
(window as any).Survey = Survey;
(window as any).SurveyCreatorCore =  Object.assign({}, SurveyCreatorCore);

</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-nav {
  background: linear-gradient(135deg, #1ab394 0%, #159a80 100%);
  color: white;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 60px;
  flex-shrink: 0;
}

.nav-brand h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.nav-links {
  display: flex;
  gap: 10px;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.1);
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.2);
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.25);
  font-weight: 600;
}

.main-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>