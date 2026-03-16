# Course Registration System - Frontend

A modern, responsive course registration portal built with React, TypeScript, and Tailwind CSS for Aligarh Muslim University.

## 🚀 Features

- **Student Portal**: Course registration, enrollment history, grade tracking
- **Teacher/Admin Portal**: Course management, student approvals, analytics
- **Authentication**: Secure login with JWT tokens, OTP verification
- **Responsive Design**: Mobile-first design with modern UI components
- **Real-time Updates**: Live registration status and notifications
- **CSV Upload**: Bulk data import for courses and results

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
VITE_API_BASE_URL=https://course-re-backend-do7r.vercel.app
```

4. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📦 Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## 🌐 Deployment

### Deploy to Netlify

1. **Quick Deploy** (Recommended):
   - Push your code to GitHub
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Select your repository
   - Build settings are auto-detected from `netlify.toml`
   - Add environment variable: `VITE_API_BASE_URL=https://course-re-backend-do7r.vercel.app`
   - Deploy!

2. **Using Netlify CLI**:
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API URL | Yes |

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Header.tsx      # Navigation header
│   ├── CourseFilters.tsx
│   └── ...
├── pages/              # Route pages
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   └── ...
├── context/            # React Context providers
│   └── AuthContext.tsx
├── services/           # API services
│   └── api.ts
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── main.tsx           # App entry point
```

## 🎨 UI Components

Built with [shadcn/ui](https://ui.shadcn.com/) - a collection of re-usable components:
- Forms, Inputs, Buttons
- Dialogs, Dropdowns, Tooltips
- Tables, Cards, Badges
- Charts, Progress bars
- And more...

## 🔗 API Integration

The frontend connects to the backend API at:
```
https://course-re-backend-do7r.vercel.app
```

API documentation: [api.endpoints.md](./api.endpoints.md)

## 👥 User Roles

1. **Student**: Register for courses, view grades, track progress
2. **Teacher**: View courses and students (read-only)
3. **Admin**: Full access - manage courses, approve registrations, upload data

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Review [api.endpoints.md](./api.endpoints.md) for API documentation
- Open an issue on GitHub

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Vite](https://vitejs.dev/) for the blazing fast build tool
