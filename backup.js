const cron = require('node-cron'), spawn = require('child_process').spawn;

let dbBackupTask = cron.schedule('59 11,23 * * *', () => {
    let backupProcess = spawn('mongodump', [
        '--gzip'
      ]);

    backupProcess.on('exit', (code, signal) => {
        if(code)
            console.log('Backup process exited with code ', code);
        else if (signal)
            console.error('Backup process was killed with signal ', signal);
        else
            console.log('Successfully backedup the database')
    });
});
