<script lang="ts" setup>
import { ref, computed } from 'vue';

const props = defineProps({
  creator: {
    type: Object,
    required: true
  }
});

const showChainManager = ref(false);
const selectedChain = ref(null);
const copyPrefix = ref('copy_');

const questionChains = computed(() => {
  const survey = props.creator.survey;
  if (!survey || !survey.pages) return [];
  
  const chains = [];
  survey.pages.forEach(page => {
    if (page.elements && page.elements.length > 0) {
      chains.push({
        pageName: page.name,
        pageTitle: page.title,
        elements: page.elements,
        elementCount: page.elements.length
      });
    }
  });
  return chains;
});

const copyChain = (chain) => {
  const survey = props.creator.survey;
  const newPageName = `${copyPrefix.value}${chain.pageName}`;
  
  const newElements = chain.elements.map(element => {
    const elementCopy = JSON.parse(JSON.stringify(element));
    elementCopy.name = `${copyPrefix.value}${element.name}`;
    if (elementCopy.title) {
      elementCopy.title = elementCopy.title.replace(
        new RegExp(`\\b${element.name}\\b`, 'g'),
        elementCopy.name
      );
    }
    return elementCopy;
  });
  
  const newPage = {
    name: newPageName,
    title: `Copy of ${chain.pageTitle}`,
    elements: newElements
  };
  
  survey.addPage(newPage);
  alert(`✓ Copied chain "${chain.pageTitle}" to new page "${newPageName}"\n\nEdit the question names and logic in the Logic tab as needed.`);
};

const exportChainAsJson = (chain) => {
  const chainJson = {
    pageName: chain.pageName,
    pageTitle: chain.pageTitle,
    elements: chain.elements
  };
  const dataStr = JSON.stringify(chainJson, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `question-chain-${chain.pageName}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
</script>

<template>
  <div style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
    <button 
      @click="showChainManager = !showChainManager"
      style="
        padding: 10px 15px;
        background-color: #1ab394;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      "
    >
      {{ showChainManager ? '✕' : '⚙ Question Chains' }}
    </button>

    <div v-if="showChainManager" style="
      position: absolute;
      bottom: 60px;
      right: 0;
      width: 350px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 15px;
      max-height: 500px;
      overflow-y: auto;
    ">
      <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 14px; color: #333;">
        Question Chains
      </h3>
      
      <div v-if="questionChains.length === 0" style="color: #999; font-size: 13px;">
        No question chains found. Add elements to pages to see them listed here.
      </div>

      <div v-for="chain in questionChains" :key="chain.pageName" style="
        margin-bottom: 12px;
        padding: 10px;
        background: #f9f9f9;
        border-left: 3px solid #1ab394;
        border-radius: 2px;
      ">
        <div style="font-weight: bold; font-size: 13px; margin-bottom: 5px; color: #333;">
          {{ chain.pageTitle }}
        </div>
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
          {{ chain.elementCount }} question{{ chain.elementCount !== 1 ? 's' : '' }}
          <ul style="margin: 5px 0 0 15px; padding: 0; font-size: 11px;">
            <li v-for="elem in chain.elements" :key="elem.name" style="margin: 2px 0;">
              {{ elem.title || elem.name }}
            </li>
          </ul>
        </div>
        <div style="display: flex; gap: 6px;">
          <button 
            @click="copyChain(chain)"
            style="
              flex: 1;
              padding: 6px 10px;
              background-color: #1ab394;
              color: white;
              border: none;
              border-radius: 3px;
              cursor: pointer;
              font-size: 12px;
              font-weight: bold;
            "
          >
            Duplicate
          </button>
          <button 
            @click="exportChainAsJson(chain)"
            style="
              flex: 1;
              padding: 6px 10px;
              background-color: #666;
              color: white;
              border: none;
              border-radius: 3px;
              cursor: pointer;
              font-size: 12px;
              font-weight: bold;
            "
          >
            Export
          </button>
        </div>
      </div>

      <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px;">
        <label style="display: block; margin-bottom: 8px; color: #666;">
          Prefix for copies:
          <input 
            v-model="copyPrefix" 
            type="text"
            style="
              width: 100%;
              padding: 5px;
              margin-top: 4px;
              border: 1px solid #ddd;
              border-radius: 3px;
              font-size: 12px;
            "
          />
        </label>
      </div>

      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 11px; color: #999;">
        <strong>Tips:</strong>
        <ul style="margin: 8px 0; padding-left: 15px;">
          <li>Use "Duplicate" to copy a question chain with a new name prefix</li>
          <li>Use the Logic tab to edit conditions between duplicated chains</li>
          <li>Export chains to save and reuse them across projects</li>
        </ul>
      </div>
    </div>
  </div>
</template>
