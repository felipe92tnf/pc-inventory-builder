# SecondByte

Aplicación web desarrollada para la gestión de una tienda de informática y compraventa tecnológica.

SecondByte permite centralizar:
- inventario de componentes y PCs completos
- montajes personalizados
- presupuestos para clientes
- servicios técnicos
- ventas y beneficios

La aplicación está diseñada para funcionar tanto en ordenador como en móvil, con una interfaz moderna, responsive y enfocada a la productividad.

---

# Funcionalidades principales

## Inventario
- Gestión de piezas individuales
- Gestión de PCs completos / premontados
- Control de stock
- Cálculo automático de precios y beneficios
- Clasificación por categorías

## Presupuestos
- Creación de presupuestos personalizados
- Añadir productos desde inventario o manualmente
- Estados:
  - borrador
  - enviado
  - aceptado
  - rechazado
- Generación de PDF profesional
- Conversión automática a montaje

## Montajes
- Creación de PCs personalizados
- Asociación de componentes del inventario
- Cálculo automático de costes y beneficios
- Gestión de PCs listos para vender

## Servicios
- Reparaciones
- Diagnósticos
- Formateos
- Instalación de sistemas operativos
- Venta de piezas sueltas
- Servicios a domicilio

## Ventas
- Histórico de ventas
- Beneficios mensuales
- Estadísticas básicas
- Separación entre:
  - PCs vendidos
  - servicios técnicos
  - piezas sueltas

---

# Tecnologías utilizadas

## Frontend
- React
- TypeScript
- Tailwind CSS
- Vite

## Backend
- Node.js
- Express.js

## Base de datos
- PostgreSQL
- Prisma ORM
- Supabase

## Despliegue
- Vercel (frontend)
- Render (backend)

## Autenticación
- Supabase Auth

---

# Arquitectura

```txt
Frontend (React)
        ↓
Backend API (Express)
        ↓
Prisma ORM
        ↓
PostgreSQL (Supabase)