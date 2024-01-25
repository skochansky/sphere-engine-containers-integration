<template>
  <div id="ide">
    <div data-id="seco-workspace" v-bind:data-workspace="WorkspaceId"></div>
    <div id="resize-handle" class="resize-handle"></div>
  </div>
  <div id="menu">
    <h1>Access Token</h1>
    <div class="custom-container">
      <input type="text" id="accessTokenInput" class="custom-input" placeholder="Your Sphere Engine access token" />
      <button class="custom-button inline" @click="addAccessToken">Add Access Token</button>
    </div>
    <h1>Choose Project</h1>
    <div class="custom-container">
      <select id="projectChoice" class="custom-select" v-model="projectId">
      </select>
    </div>
    <h1>Workspace Management</h1>
    <button class="custom-button" @click="createWorkspace" v-bind:disabled="isCreateButtonDisabled" v-bind:title="isCreateButtonDisabled ? 'Workspace already exists' : 'Create a new workspace'">Create Workspace</button>
    <button class="custom-button delete" @click="deleteWorkspace" v-bind:disabled="isRemoveButtonDisabled">Remove Workspace</button>
    <button class="custom-button hide" @click="hideWorkspace">Destroy Workspace</button>
    <button class="custom-button show" @click="showWorkspace">Render Workspace</button>
    <h1>Events</h1>
    <div class="custom-container">
      <select id="eventChoice" class="custom-select">
        <option value="afterScenarioExecution">afterScenarioExecution</option>
        <option value="afterScenarioExecutionExt">afterScenarioExecutionExt</option>
        <option value="fileContent">fileContent</option>
        <option value="stageStream">stageStream</option>
      </select>
      <button class="custom-button inline" @click="subscribe">Subscribe</button>
      <button class="custom-button inline" @click="unsubscribe">Unsubscribe</button>
    </div>
    <div id="event-results">
      <h2>Event Results</h2>
      <pre id="result" style="height: 100px; overflow-y: scroll; background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 15px;">
    </pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Ref } from 'vue';


const WorkspaceId: Ref<string> = ref('');
const accessToken = ref(''); // your authorization token generated in sphere engine panel
const apiUrl = 'https://containers.sphere-engine.com/api/v1/'
const projectId = ref(null);

const isCreateButtonDisabled = computed(() => WorkspaceId.value !== '');
const isRemoveButtonDisabled = computed( () => WorkspaceId.value === '');

onMounted(() => {
  const savedWorkspaceId = localStorage.getItem('workspaceId');
  if (savedWorkspaceId) {
    WorkspaceId.value = savedWorkspaceId;
  }

  const resizeHandle = document.getElementById('resize-handle');
  resizeHandle.addEventListener('mousedown', startResize);
});


const renderWorkspace = () => {
  let element = document.getElementById("seco-workspace");

  if (!element) {
    element = document.createElement('div');
    element.id = 'seco-workspace';
    if (WorkspaceId.value === '')

    {
      let oldWorkspaceId = localStorage.getItem('workspaceId')
      if (oldWorkspaceId != null){
        WorkspaceId.value = oldWorkspaceId
      }
    }

    element.setAttribute('data-workspace', WorkspaceId.value);

    const ide = document.getElementById('ide');
    if (ide) {
      ide.appendChild(element);
    }
  }

  const workspace = window.SE.workspace("seco-workspace");
  if (!workspace) {
    window.SE.create("seco-workspace", document.getElementById("seco-workspace"));
  }
}

const destroyWorkspace = () => {
  let workspace = SE.workspace("seco-workspace");

  if (workspace) {
    workspace.destroy();
  }
}
const createWorkspace = () => {
  let createApiUrl = apiUrl + `workspaces?access_token=${accessToken.value}`
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({'project_id': projectId.value})
  };

  fetch(createApiUrl, requestOptions)
      .then(response => response.json())
      .then(data => {

        if (data.workspace && data.workspace.id) {
          WorkspaceId.value = data.workspace.id
          localStorage.setItem('workspaceId', WorkspaceId.value)

          destroyWorkspace();
          renderWorkspace();
        }
      })
      .catch(error => {
        console.error(error)
      })
};

const deleteWorkspace = () => {
  let oldWorkspaceId = localStorage.getItem('workspaceId')
  if (oldWorkspaceId != null){
    const deleteApiUrl = apiUrl + `workspaces/${oldWorkspaceId}/remove?access_token=${accessToken.value}`
    const requestOptions = {
      method: 'PUT'
    };
    fetch(deleteApiUrl, requestOptions)
        .then(response => response.json())
        .then(data => {
          console.log('Workspace removed success.')
          localStorage.removeItem('workspaceId');
          WorkspaceId.value = ''
          destroyWorkspace();
          renderWorkspace();
        })
        .catch(error => {
          console.error(error)
        })
  } else {
    return;
  }
};

const hideWorkspace = () => {
  destroyWorkspace()
};

const showWorkspace = () => {
  renderWorkspace()
};
const handleEvent = (e: any) => {
  document.getElementById("result").textContent = JSON.stringify(e.data, null, 2);
};

const subscribe = () => {
  let eventChoice = document.getElementById("eventChoice");
  let selectedEvent = eventChoice.options[eventChoice.selectedIndex].value;
  let renderedWorkspace = document.getElementById("seco-workspace");
  if (renderedWorkspace) {
      let workspace = SE.workspace("seco-workspace");
      workspace.events.subscribe(selectedEvent, handleEvent)
      console.debug('Subscribed to event: ' + selectedEvent);
  }
};


const unsubscribe = () => {
  let eventChoice = document.getElementById("eventChoice");
  let selectedEvent = eventChoice.options[eventChoice.selectedIndex].value;
  let renderedWorkspace = document.getElementById("seco-workspace");
  if (renderedWorkspace) {
    let workspace = SE.workspace("seco-workspace");
    workspace.events.unsubscribe(selectedEvent, handleEvent)
    console.debug('Unsuscribed to event: ' + selectedEvent);
  }
};


const startResize = () => {
  window.addEventListener('mousemove', resize);
  window.addEventListener('mouseup', stopResize);
};


const resize = (event) => {
  const ide = document.getElementById('ide');
  ide.style.width = (event.clientX - ide.getBoundingClientRect().left) + 'px';
  ide.style.height = (event.clientY - ide.getBoundingClientRect().top) + 'px';
};


const stopResize = () => {
  window.removeEventListener('mousemove', resize);
  window.removeEventListener('mouseup', stopResize);
};

const addAccessToken = () => {
  const inputElement = document.getElementById('accessTokenInput');
  if (inputElement) {
    accessToken.value = inputElement.value;

    testApiEndpoint().then(isValid => {
      if (isValid) {
        listProjects();
      } else {
        console.log("Invalid response from API");
      }
    });
  }
};

const listProjects = async () => {
  let listApiUrl = apiUrl + `projects?access_token=${accessToken.value}`;
  let allProjects = [];
  let nextPageToken = null;

  do {
    const pageTokenParam = nextPageToken ? `&page_token=${nextPageToken}` : '';
    try {
      const response = await fetch(`${listApiUrl}${pageTokenParam}`);
      const data = await response.json();

      if (data && data.items) {
        allProjects.push(...data.items);
        nextPageToken = data.paging && data.paging.next_page_token;
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      break;
    }
  } while (nextPageToken);

  updateProjectDropdown(allProjects);
};

const updateProjectDropdown = (items) => {
  console.log(items.length);
  const select = document.getElementById('projectChoice');
  select.innerHTML = '';


  items.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
  });
};

const testApiEndpoint = () => {
  const testApiUrl = apiUrl + `test?access_token=${accessToken.value}`;

  return fetch(testApiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Invalid access token');
        }
        return response.json();
      })
      .then(data => {
        return !!(data && data.message === "You can use Sphere Engine Containers API");
      })
      .catch(error => {
        console.error(error);
        if (error.message === 'Invalid access token') {
          displayToast('Invalid access key', 3000);
        }
        return false;
      });
};

const displayToast = (message, timeout) => {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '20px';
  toast.style.backgroundColor = 'red';
  toast.style.color = 'white';
  toast.style.padding = '10px';
  toast.style.borderRadius = '5px';


  document.body.appendChild(toast);

  setTimeout(() => {
    document.body.removeChild(toast);
  }, timeout);
};

</script>

<style>
#ide {
  width: 75%;
  height: 90vh;
  max-width: none;
  margin: 0;
  display: flex;
  padding-bottom: 4rem;
  position: relative;
}

#menu {
  flex: 1;
  width: 25%;
  max-width: none;
  height: 90vh;
  padding: 2rem;
  font-weight: normal;
  margin-left: 20px;
  display: inline-block;
}

.custom-button {
  display: block;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  background-color: #007bff;
  color: #fff;
  margin: 5px;
}

.inline {
  display: inline;
}

.custom-button:disabled {
  background-color: #999;
  cursor: not-allowed;
}

.custom-button.delete {
  background-color: #dc3545;
}

.custom-button.delete:disabled {
  background-color: #999;
  cursor: not-allowed;
}

.custom-button.hide {
  background-color: #6c757d;
}

.custom-button.show {
  background-color: #28a745;
}

.custom-container {
  display: flex;
  align-items: center;
}

.custom-select {
  font-size: 16px;
  padding: 10px;
  margin: 5px;
  width: 250px;
}

.resize-handle {
  width: 10px;
  height: 10px;
  position: absolute;
  bottom: 65px;
  right: 0;
  cursor: nwse-resize;
}

.custom-input {
  width: 50%;
  padding: 10px;
  font-size: 13px;
}

.custom-select {
  overflow-y: auto;
}
</style>
