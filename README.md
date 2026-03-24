# Global Quake Monitor | <a href="https://projectpokemon.org/images/shiny-sprite/groudon-primal.gif"><img src="https://projectpokemon.org/images/shiny-sprite/groudon-primal.gif" alt="Primal Groudon Shiny" height="60"></a> <a href="https://projectpokemon.org/images/shiny-sprite/kyogre-primal.gif"><img src="https://projectpokemon.org/images/shiny-sprite/kyogre-primal.gif" alt="Primal Kyogre Shiny" height="35"></a> <a href="https://projectpokemon.org/images/shiny-sprite/rayquaza-mega.gif"><img src="https://projectpokemon.org/images/shiny-sprite/rayquaza-mega.gif" alt="Mega Rayquaza Shiny" height="85"></a>

An advanced **WebGL-based** data visualization engine built to track, render, and analyze global seismic activity in real-time. 
The project leverages hardware-accelerated 3D graphics to map complex GeoJSON datasets onto an interactive spherical projection, ensuring high frame rates even when rendering massive data clusters.

Powered by the **USGS (United States Geological Survey) API** live data feed and optimized for zero-latency DOM updates.



https://github.com/user-attachments/assets/f571e9a9-ecbf-4b25-8040-fa5da6764818



[**Try the Live Demo**](https://vor7rex.github.io/Global-Quake-Monitor/) <a href="https://pokemondb.net/pokedex/metagross"><img src="https://img.pokemondb.net/sprites/black-white/anim/normal/metagross.gif" alt="Metagross" height="50" align="center"></a>

## ⚙️ Core Architecture & Features
- **WebGL Geometry Merging**: Implementation of `pointsMerge` to batch hundreds of individual 3D columns into a single mesh, drastically reducing draw calls and preventing VRAM leaks/ghosting artifacts.
- **Asynchronous Data Injection**: Real-time fetching and filtering of seismic events via AbortController to safely handle overlapping network requests.
- **Advanced Camera Kinematics**: Custom `OrbitControls` calibration with physical damping (`dampingFactor`) and reduced zoom sensitivity for cinematic, fluid navigation.
- **Equirectangular Texture Mapping**: Dynamic mapping of high-resolution local textures (Earth daymap and deep space starfield) onto the scene background using `Three.TextureLoader`.
- **Responsive Glassmorphism UI**: A highly optimized, non-blocking user interface utilizing hardware-accelerated CSS `backdrop-filter` and dynamic media queries for seamless mobile transitions.
<br>

## 🛠️ Technologies

| **Core Stack** | **Implementation Details** |
| :--- | :--- |
| <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" /> | ES6+ Module pattern (IIFE), Async/Await data handling, DOM manipulation |
| <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white" /> | 3D Scene generation, Lighting arrays, Mesh materials, and SphereGeometry |
| <img src="https://img.shields.io/badge/Globe.gl-0055FF?style=for-the-badge&logo=webgl&logoColor=white" /> | Geo-spatial coordinate translation, Polygon data mapping, Custom layered tooltips |
| <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" /> | CSS Variables, Flexbox UI scaling, Custom WebKit Scrollbars |
<br>

## 📦 Quick Start

1. Clone the repository:

    ```bash
    git clone https://github.com/Vor7reX/Global-Quake-Monitor
    ```
2.  Navigate to the project directory:

    ```bash
    cd sisma-monitor
    ````

3.  Open the `index.html` file in any modern browser. *(Note: For local texture rendering, running via a local web server like VS Code 'Live Server' is recommended to bypass CORS restrictions).*

---
<div align="left">
<p valign="middle">
Created by <b>Vor7reX</b>
<a href="https://projectpokemon.org/images/shiny-sprite/mawile-mega.gif">
<img src="https://projectpokemon.org/images/shiny-sprite/mawile-mega.gif" width="75" valign="middle" alt="Mega Mawile Shiny">
</a>
</p>
</div>
