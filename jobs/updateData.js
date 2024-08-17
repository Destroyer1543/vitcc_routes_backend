import constants from "../constants.js"; 
import models from "../models/models.js";
import logger from "../logger.js";
import getPolygon from "../utils/getRoutePolygon.js";
const {server,management} = constants;
async function updateData(){
    try{
        const time= new Date().getTime();
        const res = await fetch(server.poll_url);
        const routes = await res.json();
        await models.routes.destroy({where:{},truncate:true})
        for (const route of routes){
            route.destination ??= management.vitccLocation;
            route.startPoint ??= route.stops.shift()
            const stopsData = [route.startPoint,...route.stops, route.destination];
            const polygon = (await getPolygon(stopsData)).routes;
            if (polygon.length){
                const geometry = polygon[0].geometry;
                const routeRec = await models.routes.create({
                    routeNo:route.routeNo,
                    name: route.name,
                    routeId:route.routeId,
                    type:route.type,
                    startPoint:route.startPoint,
                    geometry});
                await models.stops.bulkCreate(route.stops.map(stop=>{
                    stop.routeId = routeRec.id;
                    return stop
                }))
            }
        }
        console.log(`Update function call @${new Date(time).toISOString()} took ${(new Date().getTime() - time)} ms to complete successfully`)
    } catch (e){
        console.log(`##ERROR\n${e}\nSTACK:\n${e.stack}`);
    }
    
}

export default updateData;