#pragma strict


function Start () 
{

}

function Update () 
{
	var AT = gameObject.GetComponent(AnimationScript);

	if(Input.GetKey("a") || Input.GetKey(KeyCode.LeftArrow))
	{
		AT.rowNumber = 1;	
	}
	else if(Input.GetKey("d") || Input.GetKey(KeyCode.RightArrow))
	{
		AT.rowNumber = 1;
	}
	else {	AT.rowNumber = 0; }
}