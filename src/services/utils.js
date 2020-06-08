app.service('utils', function($rootScope, $mdSidenav) {
    this.determinePoint = (dir, el) => {
        var grid_size = $rootScope._grid_size;
        var out = { "x": this.pixel2GridPoint(el.bounds.topLeft.x), "y": this.pixel2GridPoint(el.bounds.topLeft.y) };
        switch (dir) {
            case 0:
                out.x += grid_size;
                break; //right
            case 1:
                out.x += grid_size;
                out.y -= grid_size;
                break; //up-right
            case 2:
                out.y -= grid_size;
                break; //up
            case 3:
                out.x -= grid_size;
                out.y -= grid_size;
                break; //up-left
            case 4:
                out.x -= grid_size;
                break; //left
            case 5:
                out.x -= grid_size;
                out.y += grid_size;
                break; //down-left
            case 6:
                out.y += grid_size;
                break; //down 
            case 7:
                out.x += grid_size;
                out.y += grid_size;
                break; //down-right
        }
        return out;
    }

    /**
     * Converts a pixel value to a quantized grid location
     * 
     * @param {int} raw_location - a pixel location
     * @returns {int} a quantized grid point
     */
    this.pixel2GridPoint = (raw_location) => {
        return raw_location - (raw_location % $rootScope._grid_size) + ($rootScope._grid_size / 2) + $rootScope._grid_line_width;
    }

    /**
     * Converts a grid location to a quantized pixel value
     *
     * @param {int} grid_point - quantized grid point
     * @returns {int} a pixel location
     */
    this.gridPoint2Pixel = (grid_point) => {
        return (grid_point - 1) * $rootScope._grid_size;
    }

    /**
     * 
     * @param {*} status 
     * @param {*} error 
     */
    function error_report(status, error) {
        console.log("Error: " + status.status + ", " + error);
    }

    this.screenWidth = () => { return $rootScope._grid_size * grid_count_width + 2 * grid_line_width; };
    this.screenHeight = () => { return $rootScope._grid_size * grid_count_height + 2 * grid_line_width; };

    this.toggle = (componentId) => {
        $mdSidenav(componentId).toggle();
    }

    this.getRandomQuote = () => {
        var quotes = [
            'Stupid is as stupid quotes',
            'In case of emergency, the key is under the mat',
            '3, 2, 1.......',
            'I am standing behind you',
            'Smankle',
            'Do the dew',
            'Oh god, do not let the progress bar hit 100\%!',
            'And behind curtain 3 is.....',
            'I only have the power of Grey Skull.',
            'Where the !#%& are my hard boiled eggs!',
            'It\'s open\!',
            'Oh, that\'s your solution for everything.',
            '(╯°□°)╯︵ ┻━┻',
            'The cake is a lie',
            'Whose been screwing with this thing\?!',
            'That old grey mare, ain\'t what she used to be',
            'Hail to thee Kamp Krusty!',
            'To be or not to be......not to be.',
            'Fun fact: Jet fuel CAN melt steel beams.',
            'Free masons run the country!',
            'From my point of view the Jedi are evil!',
            'Trains are blameless, holy creatures.',
            'Oh right, the quicksand!',
            'BEAT MUSIC! BEAT MUSIC! BEAT MUSIC!',
            'Does anybody know the plot yet?',
            '*miami vice theme song',
            'Do you able to smell that code?',
            'Merry Christmas to all, now you\'re all gonna die!',
            'This is page 3.',
            'Help, I\'ve fallen and I can\'t get up!',
            'Dead or alive, you\'re coming with me.',
            'Garbagio, my boy! What are you doing in the middle of the road?',
            'The force is strong with you, young Skywalker, but you are not a Jedi yet.',
            'Line?',
            'I saw it on T.V.',
            'I am Jack\'s smirking revenge',
            'Stir you around like a soup!',
            '*smokebomb',
            'Wait for it.....',
            'Reticulating splines.....',
            'Your call cannot be completed as dialed.',
            'Supplies!',
            'ACELIPS, that\'ll be the name of our new system!',
            'Where\'s my burrito!',
            'Not Lenny!',
            'I\'m not asking for a fight!',
            'Hey! Listen!',
            'Never gonna let you go!',
            'There\'s always money in the banana stand',
            '#Slpapt',
            '42',
            'I am Error',
            'www.thisman.org',
            'Museums don\'t have foosball, do they?',
            'Watch out Radioactive Man!',
            'Your princess is in another castle.',
            'You Died',
            'I want you to hit me as hard as you can.',
            'Push the little red button',
            'You\'re a wizard Harry',
            'No one expects the Spanish Inquisition',
            'Duff Man can\'t breathe! Oh no!',
            'Na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na na Batman!',
            'Obey',
            'Consume',
            'No free will',
            'Are you smoking yet?',
            '_UCK _E _N THE A__ TON_GHT',
            'Did you leave the stove on?',
            'I know what you\'re thinking. Did he fire six shots or only five?',
            'A new challenger approaches',
            'The neighbourhood is now safe.',
            'Burninating the countryside!',
            'Ancient Chinese proverb: Jar will not open.',
            'Don\'t touch that',
            'The verabouts of the wherein Kelley.',
            'No no, I fix. With my pliers.',
            'That\'s staying in.',
            'Hi! Billy Mays with a fantastic product....',
            'Schroedingers Loading Screen: \nIf you can read this, then something is either working or not working.',
            'My belt is holding my pants up, but my belt loop is holding my belt in place. I don\'t know who\'s the real hero down there!',
            'I hate it when the waffles stick together.',
            'We get it, you vape!',
            'Madness is the emergency door.',
            'Timmy get down!',
            'Not the gnome!',
            'Feel the power of the holy flame!',
            'In my restless dreams,\nI see that town.\nSilent Hill.',
            'No whammie, no whammie.....',
            'More like \"Gaygoth\"',
            'Husky Pete\'s',
            'Spaceballs 2: The search for more money',
            'It\'s a fake!',
            'Shikaka!'
        ];

        return quotes[Math.floor(Math.random() * quotes.length)];
    };
});