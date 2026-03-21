const bcrypt = require('bcrypt');
const password = 'Abc123'; // Capital A!

bcrypt.hash(password, 10).then(hash => {
    console.log('New hash:', hash);
    bcrypt.compare(password, hash).then(result => {
        console.log('Match:', result);
    });
});
