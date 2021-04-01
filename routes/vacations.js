const router = require('express').Router()

const { query } = require('../dbconfig')
const { RT, staffOnly } = require('../vt');




////////////////////////////////////////////////////////////////////////////////

router.get('/all/:id',RT, async (req, res) => {
    try {
       
        const selectFollowed_q = `SELECT * FROM followeddestinations WHERE user_id="${req.params.id}"`
        const selectFollowed = await query(selectFollowed_q)
        console.log('selectFollowed', selectFollowed)
        const selectID = selectFollowed.map(sf => sf.destination_id)
        console.log(selectID.toString())
        if (selectID.length > 0) {
            q = `SELECT * FROM destinations WHERE id NOT IN (${selectID.toString()})`
            const destinations = await query(q)

            res.status(201).json({ err: false, destinations: destinations });
            console.log("final", destinations)
        } else {
            const q = `SELECT * FROM destinations`
            const destinations = await query(q)
            res.status(201).json({ err: false, destinations: destinations })
            console.log('2', destinations)
        }
    } catch (err) {
        res.status(500).json({ err: true, err })
        console.log(err)
    }
});

router.get('/followed/:userid',RT, async (req, res) => {
    try {
        const q = `SELECT  followedDestinations.*,destinations.followers FROM followeddestinations INNER JOIN destinations ON followeddestinations.destination_id=destinations.id WHERE followeddestinations.user_id="${req.params.userid}"`
        const myDestinations = await query(q);
        res.status(201).json({ err: false, myDestinations });
        console.log('my destinations', myDestinations)
    } catch (err) {
        res.status(500).json({ err: true, err })
        console.log(err)
    }
});
router.post('/follow',RT, async (req, res) => {
    let { destinationId, image, name, price, startsFrom, endsAt, followers, moreInfo, userId } = req.body
    console.log('e p r s t', req.body)
    
    try {
        const select_q = `SELECT followers,followed FROM destinations WHERE id = "${destinationId}"`

        followers = await query(select_q)
        const updatedFollowers = followers[0].followers + 1
        console.log("followers", followers, updatedFollowers)
        const update_q = `UPDATE destinations SET followers="${updatedFollowers}",followed=1 WHERE id = "${destinationId}"`
        const updatedDestination = await query(update_q)
        const select_Q = `SELECT * FROM destinations WHERE id = "${destinationId}"`
        const selectedDestination = await query(select_Q)
        console.log('selectedDestination', selectedDestination)

        const insert_query = `INSERT INTO followeddestinations  (destination_id,image, name, price, starts_from, ends_at,  more_info,user_id)
             VALUES("${destinationId}","${image}","${name}","${price}","${startsFrom}","${endsAt}","${moreInfo}","${userId}")`
        await query(insert_query);


        const select_query = `SELECT followeddestinations.*,destinations.followers FROM followeddestinations INNER JOIN destinations ON followeddestinations.destination_id=destinations.id WHERE followeddestinations.user_id="${userId}"`
        const followedDestinations = await query(select_query)
        res.status(201).json({ followedDestinations});
        console.log('followedDestinations', followedDestinations)
    } catch (err) {
        console.log(err)
        res.status(500).json({ err: true, msg: err })
    }
});
router.delete('/:userid',RT, async (req, res) => {
    const { userid } = req.params
    const { id, destination_id } = req.body
    
    try {
        console.log('pizdec', req.params.userid, req.body.id, req.body.destination_id)
        const select_q = `SELECT followers FROM destinations WHERE id = "${destination_id}"`
        followers = await query(select_q)
        const updatedFollowers = followers[0].followers - 1
        console.log("followers", followers, updatedFollowers)
        const delete_q = `DELETE FROM followeddestinations WHERE user_id = "${req.params.userid}" AND id = "${req.body.id}"`
        await query(delete_q)
        const update_q = `UPDATE destinations SET followers = "${updatedFollowers}" WHERE destinations.id="${destination_id}"`
        await query(update_q)
        const select_q2 = `SELECT followers FROM destinations WHERE id = "${destination_id}"`
        const zeroFollowers = await query(select_q)
        console.log('zeroFollowers', zeroFollowers[0].followers)
        if (zeroFollowers[0].followers === 0) {
            const updateFollows_q = `UPDATE destinations SET followed=0  WHERE id = "${destination_id}"`
            await query(updateFollows_q)
            const select_qr = 'SELECT followed FROM destinations'
            const updateFollows = await query(select_qr)
            console.log('updateFollows', updateFollows)
        }
        const select_q1 = `SELECT followeddestinations.*,destinations.followers FROM followeddestinations INNER JOIN destinations ON followeddestinations.destination_id=destinations.id WHERE followeddestinations.user_id="${req.params.userid}"`

        const followedDestinations = await query(select_q1)

        res.json({ err: false, followedDestinations })
        console.log('followedDestinations', followedDestinations)
    } catch (error) {
        res.status(500).json({ err: true, error })
    }
});

////////////////////////////////////////A D M I N////////////////////////////////////////////////////////////////////////////////
router.get('/admin',RT, staffOnly, async (req, res) => {
    const token = req.token;
    try {
        const q = `SELECT * FROM destinations`
        const destinations = await query(q)
        res.status(201).json({ err: false, destinations })
        console.log(destinations)
    } catch (err) {
        res.status(500).json({ err: true, err })
        console.log(err)
    }
});
router.get('/followed',RT,staffOnly, async (req, res) => {
    const token = req.token;
    try {
        const q = `SELECT * FROM destinations WHERE followed=1`
        const myDestinations = await query(q);
        res.status(201).json({ err: false, myDestinations, token });
        console.log('my destinations', myDestinations)
    } catch (err) {
        res.status(500).json({ err: true, err })
        console.log(err)
    }
});

router.post('/add',RT, staffOnly, async (req, res) => {
    const token = req.token;
    const { image, name, price, startsFrom, endsAt, followers, moreInfo } = req.body
    console.log(image, name, price, startsFrom, endsAt, followers, moreInfo)

    try {
        const insert_query = `INSERT INTO destinations(image, name, price, starts_from, ends_at, followers, more_info)
                    VALUES("${image}", "${name}", "${price}", "${startsFrom}", "${endsAt}", "${followers}", "${moreInfo}")`
        const select_query = `SELECT * FROM destinations`
        await query(insert_query)
        const newDestination = await query(select_query)
        res.status(201).json({err:false,newDestination, token})
        console.log(newDestination)
    } catch (err) {
        console.log(err)
        res.status(500).json({ err: true, msg: err })
    }
});
router.put('/edit/admin/:id',RT, staffOnly, async (req, res) => {
    const token = req.token;
    console.log("hey")
    let { id } = req.params.id
    let { image, name, price, startsFrom, endsAt, followers, moreInfo } = req.body

    try {
        const update_query = `UPDATE destinations SET image = "${image}", name = "${name}", price = "${price}", starts_from = "${startsFrom}", ends_at = "${endsAt}", followers = "${followers}", more_info = "${moreInfo}"
                    WHERE id = "${req.params.id}"`
        const update_query1 = `UPDATE followeddestinations SET image = "${image}", name = "${name}", price = "${price}", starts_from = "${startsFrom}", ends_at = "${endsAt}", followers = "${followers}", more_info = "${moreInfo}"
                    WHERE destination_id = "${req.params.id}"`

        const select_query = `SELECT * FROM destinations WHERE id = "${req.params.id}"`
        await query(update_query)
        await query(update_query1)
        const updatedDestination = await query(select_query)
        res.status(201).json({ updatedDestination:updatedDestination[0], token })
        console.log('upd-d',updatedDestination)
    } catch (err) {
        console.log(err)
        res.status(500).json({ err: true, msg: err })
    }
});
router.delete('/delete/admin/:id',RT, staffOnly, async (req, res) => {
    const token = req.token;
    try {
        console.log(req.params.id)
        const delete_q = `DELETE FROM destinations WHERE id = ${req.params.id}`
        await query(delete_q)
        console.log('delete')
        const select_q = `SELECT * FROM destinations`
        const destinations = await query(select_q)
        res.status(201).json({err:false, destinations, token })
        console.log(destinations)
    } catch (error) {
        res.status(500).json({ err: true, error })
    }
});
module.exports = router