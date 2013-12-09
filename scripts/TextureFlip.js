#pragma strict

var X : float;

function Start () 
{

	X = transform.localScale.x;

}

function Update ()
{
	if(Input.GetKey("a") || Input.GetKey(KeyCode.LeftArrow))
	{
		transform.localScale.x = X;
	}
	else if(Input.GetKey("d") || Input.GetKey(KeyCode.RightArrow))
	{
		transform.localScale.x = -X;
	}

}