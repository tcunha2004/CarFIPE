const API_BASE_URL = "https://web-production-ae2fd.up.railway.app/api/cars";

// Cache para armazenar dados
let brandsCache = [];
let modelsCache = {};
let yearsCache = {};
let selectedBrand = null;
let selectedModel = null;
let selectedYear = null;

// Elementos do DOM
const brandInput = document.getElementById("brand");
const modelInput = document.getElementById("model");
const yearInput = document.getElementById("year");
const modelGroup = document.getElementById("model-group");
const yearGroup = document.getElementById("year-group");
const resultDiv = document.getElementById("result");
const errorDiv = document.getElementById("error-message");
const loadingDiv = document.getElementById("loading");
const vehicleNameSpan = document.getElementById("vehicle-name");
const yearFuelSpan = document.getElementById("year-fuel");
const fipeValueSpan = document.getElementById("fipe-value");
const referenceMonthSpan = document.getElementById("reference-month");
const historySection = document.getElementById("history-section");
const historyList = document.getElementById("history-list");

// Elementos de sugestões
const brandSuggestions = document.getElementById("brand-suggestions");
const modelSuggestions = document.getElementById("model-suggestions");
const yearSuggestions = document.getElementById("year-suggestions");

// Elementos dos passos
const steps = document.querySelectorAll(".step");

// Função para atualizar os passos
function updateSteps(currentStep) {
  steps.forEach((step, index) => {
    if (index < currentStep) {
      step.classList.add("active");
    } else {
      step.classList.remove("active");
    }
  });
}

// Função para mostrar erro
function showError(message) {
  errorDiv.style.display = "flex";
  errorDiv.querySelector("span").textContent = message;
}

// Função para esconder erro
function hideError() {
  errorDiv.style.display = "none";
}

// Função para mostrar loading
function showLoading() {
  loadingDiv.style.display = "flex";
}

// Função para esconder loading
function hideLoading() {
  loadingDiv.style.display = "none";
}

// Função para filtrar itens baseado no input
function filterItems(items, input) {
  if (!input) return [];
  const searchTerm = input.toLowerCase().trim();
  return items
    .filter((item) => item.nome.toLowerCase().includes(searchTerm))
    .slice(0, 10); // Limita a 10 resultados
}

// Função para mostrar sugestões
function showSuggestions(suggestions, items, input, onSelect) {
  suggestions.innerHTML = "";

  if (items.length > 0) {
    items.forEach((item) => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.textContent = item.nome;
      div.addEventListener("click", () => {
        input.value = item.nome;
        suggestions.style.display = "none";
        onSelect(item);
      });
      suggestions.appendChild(div);
    });
    suggestions.style.display = "block";
  } else {
    suggestions.style.display = "none";
  }
}

// Carregar marcas
async function loadBrands() {
  try {
    showLoading();
    hideError();

    const response = await fetch(`${API_BASE_URL}/brands`);
    if (!response.ok) {
      throw new Error("Erro ao carregar marcas");
    }

    brandsCache = await response.json();
    updateSteps(1);
  } catch (error) {
    showError(
      "Não foi possível carregar as marcas. Por favor, tente novamente."
    );
    console.error(error);
  } finally {
    hideLoading();
  }
}

// Carregar modelos para uma marca
async function loadModels(brandId) {
  try {
    showLoading();
    hideError();

    const response = await fetch(`${API_BASE_URL}/brands/${brandId}/models`);
    if (!response.ok) {
      throw new Error("Erro ao carregar modelos");
    }

    modelsCache[brandId] = await response.json();
    return modelsCache[brandId];
  } catch (error) {
    showError(
      "Não foi possível carregar os modelos. Por favor, tente novamente."
    );
    console.error(error);
    return [];
  } finally {
    hideLoading();
  }
}

// Carregar anos para um modelo
async function loadYears(brandId, modelId) {
  try {
    showLoading();
    hideError();

    const response = await fetch(
      `${API_BASE_URL}/brands/${brandId}/models/${modelId}/years`
    );
    if (!response.ok) {
      throw new Error("Erro ao carregar anos");
    }

    const key = `${brandId}-${modelId}`;
    yearsCache[key] = await response.json();
    return yearsCache[key];
  } catch (error) {
    showError("Não foi possível carregar os anos. Por favor, tente novamente.");
    console.error(error);
    return [];
  } finally {
    hideLoading();
  }
}

// Event Listeners
brandInput.addEventListener("input", (e) => {
  const filtered = filterItems(brandsCache, e.target.value);
  showSuggestions(brandSuggestions, filtered, brandInput, async (item) => {
    selectedBrand = item;
    modelInput.value = "";
    yearInput.value = "";
    modelGroup.style.display = "block";
    yearGroup.style.display = "none";
    resultDiv.style.display = "none";
    updateSteps(2);

    // Carregar modelos quando selecionar a marca
    await loadModels(item.codigo);
  });
});

modelInput.addEventListener("input", (e) => {
  if (!selectedBrand) return;

  const models = modelsCache[selectedBrand.codigo] || [];
  const filtered = filterItems(models, e.target.value);
  showSuggestions(modelSuggestions, filtered, modelInput, async (item) => {
    selectedModel = item;
    yearInput.value = "";
    yearGroup.style.display = "block";
    resultDiv.style.display = "none";
    updateSteps(3);

    // Carregar anos quando selecionar o modelo
    await loadYears(selectedBrand.codigo, item.codigo);
  });
});

yearInput.addEventListener("input", (e) => {
  if (!selectedBrand || !selectedModel) return;

  const key = `${selectedBrand.codigo}-${selectedModel.codigo}`;
  const years = yearsCache[key] || [];
  const filtered = filterItems(years, e.target.value);
  showSuggestions(yearSuggestions, filtered, yearInput, (item) => {
    selectedYear = item;
    loadVehicleInfo(selectedBrand.codigo, selectedModel.codigo, item.codigo);
  });
});

// Carregar informações do veículo
async function loadVehicleInfo(brandId, modelId, yearId) {
  try {
    showLoading();
    hideError();

    const response = await fetch(
      `${API_BASE_URL}/brands/${brandId}/models/${modelId}/years/${yearId}`
    );
    if (!response.ok) {
      throw new Error("Erro ao carregar informações do veículo");
    }

    const info = await response.json();

    vehicleNameSpan.textContent = `${info.marca} ${info.modelo}`;
    yearFuelSpan.textContent = `${info.anoModelo} - ${info.combustivel}`;
    fipeValueSpan.textContent = info.preco;
    referenceMonthSpan.textContent = `Mês de referência: ${info.mesDeReferencia}`;

    resultDiv.style.display = "block";

    // Adicionar ao histórico
    addToHistory(info);
  } catch (error) {
    showError(
      "Não foi possível carregar as informações do veículo. Por favor, tente novamente."
    );
    console.error(error);
  } finally {
    hideLoading();
  }
}

// Funções do histórico
function addToHistory(info) {
  const history = getHistory();
  const newEntry = {
    id: Date.now(),
    marca: info.marca,
    modelo: info.modelo,
    ano: info.anoModelo,
    combustivel: info.combustivel,
    preco: info.preco,
    timestamp: new Date().toISOString(),
  };

  history.unshift(newEntry);
  if (history.length > 10) history.pop(); // Manter apenas os 10 últimos

  localStorage.setItem("fipeHistory", JSON.stringify(history));
  updateHistoryUI();
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("fipeHistory")) || [];
  } catch {
    return [];
  }
}

function updateHistoryUI() {
  const history = getHistory();

  if (history.length > 0) {
    historySection.style.display = "block";
    historyList.innerHTML = "";

    history.forEach((entry) => {
      const div = document.createElement("div");
      div.className = "history-item";
      div.innerHTML = `
                <div class="history-item-info">
                    <div class="history-item-title">${entry.marca} ${entry.modelo}</div>
                    <div class="history-item-subtitle">${entry.ano} - ${entry.combustivel}</div>
                </div>
                <div class="history-item-price">${entry.preco}</div>
            `;
      historyList.appendChild(div);
    });
  } else {
    historySection.style.display = "none";
  }
}

// Fechar sugestões quando clicar fora
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-container")) {
    brandSuggestions.style.display = "none";
    modelSuggestions.style.display = "none";
    yearSuggestions.style.display = "none";
  }
});

// Inicializar a aplicação
document.addEventListener("DOMContentLoaded", () => {
  loadBrands();
  updateHistoryUI();
});
