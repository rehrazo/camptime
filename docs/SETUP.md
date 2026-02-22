# Setup Guide for Camptime

## Prerequisites
Before you begin, ensure you have the following installed on your system:
- Node.js (version 14 or above)
- npm (Node Package Manager)
- MongoDB (local or cloud instance)
- Git

## Installation Steps
1. **Clone the Repository**:  Open your terminal and run the following command:
   ```bash
   git clone https://github.com/rehrazo/camptime.git
   cd camptime
   ```

2. **Install Dependencies**: Use npm to install the necessary packages:
   ```bash
   npm install
   ```

3. **Setup Environment Variables**: Copy the sample environment configuration file and update your variables:
   ```bash
   cp .env.sample .env
   nano .env  # or use your preferred text editor
   ```
   Update the following variables in the `.env` file:
   - `DB_URI`: Your database connection string
   - `PORT`: The port on which the application will run (default is 3000)
   
## Database Setup
1. **MongoDB Configuration**: If you're using a local MongoDB instance, ensure it is running. If you're using a cloud instance, make sure you have the correct URI.
2. **Create a Database**: In the MongoDB shell or your database GUI, create a database named `camptime`.
3. **Initial Data Seeding**: Run the initial data scripts provided in the `scripts/` folder to populate the database with necessary data.
   ```bash
   node scripts/seed.js
   ```

## Environment Configuration 
- Ensure that your `.env` file is configured correctly with all necessary variables.
- Consider using `dotenv` to load environment variables during development.

## Development Commands
- **Start the Development Server**:  Run the following command to start the application:
   ```bash
   npm start
   ```
- **Run Tests**: Execute tests to ensure everything is functioning as expected:
   ```bash
   npm test
   ```

## Troubleshooting
- **Application Won't Start**: Check for port conflicts or unfulfilled dependencies.
- **Database Connection Errors**: Ensure your MongoDB server is running and the URI in the `.env` file is correct.
- **Check Logs**: Review application logs for specific error messages that can help in diagnosing issues.

## Security Checklist
- Ensure your MongoDB instance is secured (authentication enabled, appropriate network policies).
- Review comments and sensitive information in your `.env` file to ensure no leaking of secrets.
- Regularly update dependencies to minimize security vulnerabilities.
- Implement rate limiting and input validation to protect against common web vulnerabilities.

This guide should provide a comprehensive overview to get started with the Camptime project!