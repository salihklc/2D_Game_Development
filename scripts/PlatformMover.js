#pragma strict

private var Xpos : float ;
private var Ypos : float ;
private var max : boolean ;

var Vert : boolean ;
var maxAmount : int ;
var step : float ;

function Start () 
{
	Xpos = transform.position.x ;
	Ypos = transform.position.y ;
	
}

function Update () 
{
	//MAXIN AYARLANMASI
	
	if(Vert) // yatay için max
	{
		if(transform.position.y >= Ypos + maxAmount)
			max = true ;
		else if(transform.position.y <= Ypos)
			max = false ;
	}
	else // dikey için max
	{
		if(transform.position.x >= Xpos + maxAmount)
			max = true ;
		else if(transform.position.x <= Xpos)
			max = false ;
	
	}

	//PLATFORMUN HAREKETiNi YAPAN KOD
	if(Vert) // Yatay hareket için
	{
		if(!max)
		{
			transform.position.y = transform.position.y + step ;
		}
		else
		{
			transform.position.y = transform.position.y - step ;
		}
	}
	else // Dikey olarak hareket için
	{
		if(!max)
		{
			transform.position.x = transform.position.x + step ;
		}
		else
		{
			transform.position.x = transform.position.x - step ;
		}
	}
	
}