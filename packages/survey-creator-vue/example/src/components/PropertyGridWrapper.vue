<template>
  <div :class="model.rootCss">
    <SvComponent :is="'svc-search'" :model="model.searchManager"></SvComponent>
    
    <!-- Show Fields Button - integrated into property grid -->
    <div class="svc-property-grid__button-row">
      <button 
        class="svc-property-grid__show-fields-btn" 
        @click="handleToggleFields"
        title="Toggle field references panel"
      >
        🔗 Show Fields
      </button>
    </div>
    
    <SurveyComponent
      v-if="!!model.survey"
      :survey="model.survey"
    ></SurveyComponent>
  </div>
</template>

<script lang="ts" setup>
import { inject } from 'vue';
import { SurveyComponent, SvComponent } from "survey-vue3-ui";
import type { PropertyGridViewModel } from "survey-creator-core";
import { useBase } from "survey-vue3-ui";

const props = defineProps<{ model: PropertyGridViewModel }>();
useBase(() => props.model);

const openFieldPiping = inject<() => void>('openFieldPiping');

const handleToggleFields = () => {
  console.log('Show Fields button clicked!');
  if (openFieldPiping) {
    openFieldPiping();
  } else {
    console.error('openFieldPiping function not found - provide/inject may not be working');
  }
};
</script>

<style scoped>
.svc-property-grid__button-row {
  padding: 8px 12px;
  border-bottom: 1px solid #e7e7e7;
}

.svc-property-grid__show-fields-btn {
  display: block;
  width: 100%;
  padding: 10px 12px;
  background: #1ab394;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
}

.svc-property-grid__show-fields-btn:hover {
  background: #159a80;
}
</style>
