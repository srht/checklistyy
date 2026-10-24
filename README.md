# Checklisty

A modern web application for creating, managing, and sharing checklists with the world.

## Features

- Create beautiful, organized checklists
- Share checklists with others
- Collaborate on checklists in real-time
- Modern, responsive design
- User authentication and authorization

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- SQLite (better-sqlite3)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_PATH="./data/checklisty.db"
   ```

4. The SQLite database and tables are created automatically on first run.

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License. 