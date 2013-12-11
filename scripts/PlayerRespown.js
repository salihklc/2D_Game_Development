#pragma strict

var player : GameObject ;
var spawnPoint : Transform ;

function OnTriggerEnter(otherPlayer : Collider)
{
	Destroy(otherPlayer.gameObject) ;
	var newPlayer : GameObject = Instantiate(player ,spawnPoint.position ,Quaternion.identity) ;
	var camFollow = Camera.main.GetComponent(SmoothFollowCamera);
	camFollow.target = newPlayer.transform ;
}