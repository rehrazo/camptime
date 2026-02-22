# Setup Guide for Camptime

## Prerequisites
Before you begin, ensure you have the following installed on your system:
- Node.js (version 14 or above)
- npm (Node Package Manager)
- MySQL (version 5.7 or above)
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
   ```powershell
   Copy-Item .env.example .env
   code .env  # opens in VS Code
   ```
   Update the following variables in the `.env` file:
   - `DB_HOST`: Your MySQL host (default is localhost)
   - `DB_USER`: Your MySQL username
   - `DB_PASSWORD`: Your MySQL password
   - `DB_NAME`: Your database name (default is camptime)
   - `PORT`: The port on which the application will run (default is 5000)
   
## Database Setup
1. **MySQL Configuration**: Ensure your MySQL server is running. You can start it with:
   ```powershell
   # If MySQL is installed as a service
   Start-Service MySQL80  # or your MySQL service name
   ```
2. **Create a Database**: In the MySQL shell or your database GUI (like MySQL Workbench), create a database named `camptime`:
   ```sql
   CREATE DATABASE camptime;
   ```
3. **Import Schema**: Run the schema file to create tables:
   ```powershell
   mysql -u root -p camptime < database/schema.sql
   ```
4. **Initial Data Seeding** (optional): Run the initial data scripts provided in the `scripts/` folder to populate the database with necessary data:
   ```powershell
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
- **Database Connection Errors**: Ensure your MySQL server is running and the credentials in the `.env` file are correct.
- **Check Logs**: Review application logs for specific error messages that can help in diagnosing issues.
- **MySQL Connection Issues**: Verify that MySQL is running with `Get-Service MySQL*` in PowerShell.

## Security Checklist
- Ensure your MySQL instance is secured (strong passwords, appropriate user privileges, firewall rules).
- Review comments and sensitive information in your `.env` file to ensure no leaking of secrets.
- Regularly update dependencies to minimize security vulnerabilities.
- Implement rate limiting and input validation to protect against common web vulnerabilities.

This guide should provide a comprehensive overview to get started with the Camptime project!