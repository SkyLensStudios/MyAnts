# 🐜 MyAnts - Hyper-Realistic Ant Farm Simulator

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()
[![WebGPU](https://img.shields.io/badge/WebGPU-enabled-orange)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue)]()

> A scientifically accurate, high-performance ant colony simulator.

## 🌟 Overview

MyAnts is a real-time ant colony simulation designed for scientific accuracy and large-scale biological modeling. It leverages modern web technologies, including WebGPU and Web Workers, to simulate colonies of over 50,000 ants directly in the browser.

The project features a modular Entity Component System (ECS) architecture, GPU-accelerated systems for performance-critical tasks, and a detailed biological model to simulate emergent behaviors.

## 🎮 Features

### 🔬 Scientific Accuracy
- **Biologically-accurate behavioral modeling** based on real ant research.
- **Realistic chemical communication** with pheromone diffusion.
- **Colony-level emergent behaviors** from individual ant interactions.
- **Environmental factor integration** (e.g., temperature, humidity).

### 📊 High Performance
- **50,000+ ant simulation** capability at interactive frame rates.
- **GPU-accelerated** compute for performance-critical systems.
- **Cross-platform compatibility** with a WebGPU -> WebGL -> 2D Canvas fallback system.
- **Memory-efficient** architecture using an Entity Component System (ECS).

### 🎨 Advanced Rendering
- **2D and 3D rendering** modes.
- **Instanced rendering** for large numbers of ants.
- **Level of Detail (LOD)** system for optimal performance.

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript 5.2
- **Rendering**: Three.js (for 3D) and HTML5 Canvas (for 2D)
- **GPU Compute**: WebGPU with a WebGL fallback
- **AI/ML**: Custom models for ant behavior
- **Build**: Webpack 5
- **Platform**: Electron + Web

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A modern browser with WebGPU support (e.g., Chrome 113+, Edge 113+)
- 8GB+ RAM recommended for large simulations

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/MyAnts.git
cd MyAnts

# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run start:web
```

### Usage

```bash
# Web development
npm run start:web      # Starts webpack dev server on localhost:3000

# Electron app
npm run dev           # Builds and starts Electron app

# Production build
npm run build         # Creates optimized production build
```

## 📖 Documentation

- [Project Status & Roadmap](./PROJECT_STATUS.md) - A high-level overview of the project's status, completed milestones, and future plans.
- [Architecture Overview](./ant_farm_architecture.md) - A detailed description of the project's architecture.
- [Developer Tools](./DEVELOPER_TOOLS.md) - A guide to the in-app developer and debugging tools.

## 🤝 Contributing

We welcome contributions from researchers, developers, and enthusiasts! Please see the [Project Status & Roadmap](./PROJECT_STATUS.md) for areas where you can contribute.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- The myrmecology and computational biology research communities.
- The developers of the open-source libraries used in this project.

## 📞 Contact

- **Project Lead**: DarkR.Dev
- **Issues**: [GitHub Issues](https://github.com/yourusername/MyAnts/issues)

---

**Made with ❤️ for scientific discovery and educational advancement**
