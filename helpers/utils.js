const titaniumUsers = ["acallahan@titanium.com", "bsanborn@titanium.com", "ghimstead@titanum.com",]
function parseEmails(input) {
    if (!input) return [];

    return input
        .split(",")               // split by comma
        .map(email => email.trim()) // remove spaces
        .filter(email => email.length > 0); // remove blanks
}

module.exports = { titaniumUsers, parseEmails };